import { describe, expect, it } from "vitest";
import {
  assertPublicRepoImportAllowed,
  resolveUserEntry,
  UPDATE_NOTICE,
  UserGithubImportError,
} from "./user-github-import.js";
import { encodeOauthState, parseOauthState } from "./user-auth.js";

describe("assertPublicRepoImportAllowed", () => {
  it("allows personal public repos owned by the user", () => {
    expect(() =>
      assertPublicRepoImportAllowed({
        githubLogin: "alice",
        repo: { private: false, owner: { login: "alice", type: "User" } },
      }),
    ).not.toThrow();
  });

  it("allows org repos when the user has admin", () => {
    expect(() =>
      assertPublicRepoImportAllowed({
        githubLogin: "alice",
        repo: {
          private: false,
          owner: { login: "acme", type: "Organization" },
          permissions: { admin: true },
        },
      }),
    ).not.toThrow();
  });

  it("rejects private repos", () => {
    expect(() =>
      assertPublicRepoImportAllowed({
        githubLogin: "alice",
        repo: { private: true, owner: { login: "alice", type: "User" } },
      }),
    ).toThrow(UserGithubImportError);
  });

  it("rejects org repos without admin", () => {
    expect(() =>
      assertPublicRepoImportAllowed({
        githubLogin: "alice",
        repo: {
          private: false,
          owner: { login: "acme", type: "Organization" },
          permissions: { admin: false, push: true },
        },
      }),
    ).toThrow(/own or admin/i);
  });
});

describe("resolveUserEntry", () => {
  it("prefers SKILL.md even when another entry is requested", () => {
    expect(
      resolveUserEntry({
        rootFiles: ["README.md", "SKILL.md"],
        requestedEntry: "README.md",
      }),
    ).toBe("SKILL.md");
  });

  it("requires an entry when SKILL.md is missing", () => {
    expect(() => resolveUserEntry({ rootFiles: ["README.md", "notes.md"] })).toThrow(
      /Pick the entry file/i,
    );
    try {
      resolveUserEntry({ rootFiles: ["README.md", "notes.md"] });
    } catch (error) {
      expect(error).toMatchObject({ code: "entry_required", files: ["README.md", "notes.md"] });
    }
  });

  it("accepts a chosen root entry file", () => {
    expect(
      resolveUserEntry({
        rootFiles: ["README.md", "AGENTS.md"],
        requestedEntry: "agents.md",
      }),
    ).toBe("AGENTS.md");
  });
});

describe("oauth state", () => {
  it("round-trips login and connect intents", () => {
    const login = encodeOauthState("login", "abc");
    expect(parseOauthState(login)).toEqual({ intent: "login", nonce: "abc" });
    const connect = encodeOauthState("connect", "xyz");
    expect(parseOauthState(connect)).toEqual({ intent: "connect", nonce: "xyz" });
    expect(parseOauthState("bad")).toBeNull();
  });
});

describe("update notice copy", () => {
  it("mentions new version in plain language", () => {
    expect(UPDATE_NOTICE).toMatch(/new version/i);
    expect(UPDATE_NOTICE).toMatch(/already on AIPM/i);
  });
});
