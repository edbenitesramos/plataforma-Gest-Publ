import { google } from 'googleapis'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
]

const FOLDER_NAME = 'Plataforma GovAnalytics'

function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  )
}

export function getAuthUrl(userId: string): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: userId,
  })
}

export async function handleCallback(code: string, userId: string): Promise<void> {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token ?? null,
      googleRefreshToken: tokens.refresh_token ?? null,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  })
}

export async function getOAuthClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  })

  if (!user?.googleAccessToken) {
    throw new Error('Google Drive não conectado')
  }

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken ?? undefined,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined,
  })

  // If token is expired or will expire soon, refresh it
  if (
    user.googleTokenExpiry &&
    user.googleTokenExpiry.getTime() < Date.now() + 5 * 60 * 1000
  ) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: credentials.access_token ?? null,
        googleTokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      },
    })
    oauth2Client.setCredentials(credentials)
  }

  return oauth2Client
}

export async function listFiles(
  userId: string,
  query?: string,
  pageToken?: string,
) {
  const auth = await getOAuthClient(userId)
  const drive = google.drive({ version: 'v3', auth })

  const q = query
    ? `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`
    : 'trashed = false'

  const response = await drive.files.list({
    q,
    pageSize: 20,
    pageToken: pageToken ?? undefined,
    fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, size)',
  })

  return {
    files: response.data.files ?? [],
    nextPageToken: response.data.nextPageToken ?? null,
  }
}

async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
): Promise<string> {
  const res = await drive.files.list({
    q: `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }

  const folder = await drive.files.create({
    requestBody: {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  return folder.data.id!
}

export async function attachFile(
  userId: string,
  caseId: string,
  fileId: string,
) {
  const auth = await getOAuthClient(userId)
  const drive = google.drive({ version: 'v3', auth })

  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, webViewLink, webContentLink, iconLink, size',
  })

  const file = res.data

  return prisma.driveFile.create({
    data: {
      userId,
      caseId,
      driveFileId: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webViewLink: file.webViewLink ?? null,
      webContentLink: file.webContentLink ?? null,
      iconLink: file.iconLink ?? null,
      size: file.size ? BigInt(file.size) : null,
    },
  })
}

export async function uploadFile(
  userId: string,
  caseId: string | undefined,
  filename: string,
  mimeType: string,
  buffer: Buffer,
) {
  const auth = await getOAuthClient(userId)
  const drive = google.drive({ version: 'v3', auth })

  const folderId = await getOrCreateFolder(drive)

  const { Readable } = await import('stream')
  const stream = Readable.from(buffer)

  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, mimeType, webViewLink, webContentLink, iconLink, size',
  })

  const file = res.data

  return prisma.driveFile.create({
    data: {
      userId,
      caseId: caseId ?? null,
      driveFileId: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webViewLink: file.webViewLink ?? null,
      webContentLink: file.webContentLink ?? null,
      iconLink: file.iconLink ?? null,
      size: file.size ? BigInt(file.size) : null,
    },
  })
}

export async function getFilesForCase(userId: string, caseId: string) {
  return prisma.driveFile.findMany({
    where: { userId, caseId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function disconnect(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true },
  })

  if (user?.googleAccessToken) {
    try {
      const oauth2Client = createOAuth2Client()
      oauth2Client.setCredentials({ access_token: user.googleAccessToken })
      await oauth2Client.revokeToken(user.googleAccessToken)
    } catch {
      // Ignore revoke errors – still clear from DB
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  })
}

export async function isConnected(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true },
  })
  return !!user?.googleAccessToken
}
