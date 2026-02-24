// src/types.ts
export type Role = "propriétaire" | "client" | "autre"

export interface Profile {
  full_name: string | null
  id: string
  role?: Role
}
