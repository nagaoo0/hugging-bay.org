export interface User {
  id: string
  username: string
  email?: string
  display_name: string
  bio: string
  avatar_url: string
  is_admin: boolean
  is_moderator: boolean
  created_at: string
}

export interface Model {
  id: string
  slug: string
  name: string
  description: string
  architecture: string
  framework: string
  license: string
  language: string
  uploader_id: string
  uploader?: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>
  verification_status: VerificationStatus
  tags: string[]
  download_count: number
  latest_release?: Release
  created_at: string
  updated_at: string
}

export type VerificationStatus =
  | 'verified_author'
  | 'community_verified'
  | 'mirror'
  | 'archived'
  | 'unverified'

export interface Release {
  id: string
  model_id: string
  version: string
  description: string
  is_latest: boolean
  magnet_uri: string
  torrent_url: string
  info_hash: string
  sha256: string
  sha512: string
  blake3: string
  total_size: number
  parameter_count: number
  quantization: string
  file_manifest: ManifestFile[]
  uploader_id: string
  created_at: string
}

export interface ManifestFile {
  path: string
  size: number
  sha256?: string
}

export interface Comment {
  id: string
  model_id: string
  user_id: string
  user?: Pick<User, 'username' | 'display_name' | 'avatar_url'>
  content: string
  created_at: string
  updated_at: string
}

export interface PagedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface SearchResult {
  hits: Partial<Model>[]
  total_hits: number
  query: string
  offset: number
  limit: number
}

export interface APIKey {
  id: string
  name: string
  key_preview: string
  last_used_at?: string
  created_at: string
}
