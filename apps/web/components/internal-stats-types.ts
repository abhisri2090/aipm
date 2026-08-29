export type InternalStats = {
  users: number;
  orgs: number;
  reservedPackages: number;
  publishedPackages: number;
  publishedVersions: number;
  recentUsers: Array<{ username: string; githubLogin: string; name: string | null; createdAt: string }>;
  recentOrgs: Array<{ slug: string; name: string; createdAt: string }>;
  recentPublished: Array<{ name: string; version: string; createdAt: string }>;
};
