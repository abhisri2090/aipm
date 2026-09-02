"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { linkifyPlainText } from "../lib/linkify-plain-text";
import shell from "../app/page-shell.module.css";
import styles from "./comments-section.module.css";

type CommentAuthor = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

type CommentItem = {
  id: string;
  body: string | null;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replyCount: number;
  replies: CommentItem[];
  canEdit: boolean;
  canDelete: boolean;
};

type CommentsResponse = {
  comments: CommentItem[];
  totalCount: number;
};

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CommentBody({ text }: { text: string }) {
  return (
    <p className={styles.body}>
      {linkifyPlainText(text).map((part, index) =>
        typeof part === "string" ? (
          <span key={index}>{part}</span>
        ) : (
          <a key={index} href={part.href} rel="noopener noreferrer" target="_blank">
            {part.label}
          </a>
        ),
      )}
    </p>
  );
}

function Author({ author }: { author: CommentAuthor }) {
  const label = author.name?.trim() || author.username;
  const initial = label.charAt(0).toUpperCase() || "A";
  return (
    <div className={styles.author}>
      {author.avatarUrl ? (
        <img alt="" src={author.avatarUrl} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
      <div>
        <strong>{label}</strong>
        <small>@{author.username}</small>
      </div>
    </div>
  );
}

export function CommentsSection({
  targetType,
  targetKey,
}: {
  targetType: "package" | "prompt";
  targetKey: string;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<CommentsResponse>(
        `/v1/comments?targetType=${encodeURIComponent(targetType)}&targetKey=${encodeURIComponent(targetKey)}`,
        undefined,
        { silent: true },
      );
      setComments(data.comments);
      setTotalCount(data.totalCount);
    } catch {
      setComments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [targetKey, targetType]);

  useEffect(() => {
    void api("/v1/me", undefined, { silent: true })
      .then(() => setSignedIn(true))
      .catch(() => setSignedIn(false));
    void load();
  }, [load]);

  async function postComment(body: string, parentId?: string | null) {
    setSubmitting(true);
    setStatus("");
    try {
      await api(
        "/v1/comments",
        {
          method: "POST",
          body: JSON.stringify({
            targetType,
            targetKey,
            body,
            parentId: parentId ?? null,
          }),
        },
        { timeoutMs: 10_000 },
      );
      setDraft("");
      setReplyDraft("");
      setReplyTo(null);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(id: string) {
    setSubmitting(true);
    setStatus("");
    try {
      await api(
        `/v1/comments/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify({ body: editDraft }) },
        { timeoutMs: 10_000 },
      );
      setEditingId(null);
      setEditDraft("");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeComment(id: string) {
    if (!window.confirm("Remove this comment?")) return;
    setSubmitting(true);
    setStatus("");
    try {
      await api(`/v1/comments/${encodeURIComponent(id)}`, { method: "DELETE" }, { timeoutMs: 10_000 });
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete comment");
    } finally {
      setSubmitting(false);
    }
  }

  function renderComment(comment: CommentItem, isReply = false) {
    return (
      <article className={isReply ? styles.reply : styles.comment} key={comment.id}>
        <Author author={comment.author} />
        <time dateTime={comment.createdAt}>{formatWhen(comment.createdAt)}</time>
        {comment.deleted ? (
          <p className={styles.removed}>Comment removed</p>
        ) : editingId === comment.id ? (
          <div className={styles.composer}>
            <textarea
              maxLength={2000}
              rows={3}
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
            />
            <div className={styles.actions}>
              <button
                disabled={submitting || !editDraft.trim()}
                type="button"
                onClick={() => void saveEdit(comment.id)}
              >
                Save
              </button>
              <button type="button" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <CommentBody text={comment.body ?? ""} />
        )}
        {!comment.deleted && editingId !== comment.id ? (
          <div className={styles.actions}>
            {!isReply && signedIn ? (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(comment.id);
                  setReplyDraft("");
                }}
              >
                Reply
              </button>
            ) : null}
            {comment.canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(comment.id);
                  setEditDraft(comment.body ?? "");
                }}
              >
                Edit
              </button>
            ) : null}
            {comment.canDelete ? (
              <button type="button" onClick={() => void removeComment(comment.id)}>
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
        {!isReply && replyTo === comment.id ? (
          <div className={styles.replyComposer}>
            <textarea
              maxLength={2000}
              placeholder="Write a reply"
              rows={3}
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
            />
            <div className={styles.actions}>
              <button
                disabled={submitting || !replyDraft.trim()}
                type="button"
                onClick={() => void postComment(replyDraft, comment.id)}
              >
                Post reply
              </button>
              <button type="button" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {!isReply && comment.replies.length ? (
          <div className={styles.replies}>
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="comments-title">
      <div className={styles.heading}>
        <p className={shell.eyebrow}>Discussion</p>
        <h2 id="comments-title">Comments ({totalCount})</h2>
      </div>

      {signedIn ? (
        <form
          className={styles.composer}
          onSubmit={(event) => {
            event.preventDefault();
            void postComment(draft);
          }}
        >
          <label htmlFor="comment-draft">Add a comment</label>
          <textarea
            id="comment-draft"
            maxLength={2000}
            placeholder="Share feedback, questions, or tips"
            required
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button disabled={submitting || !draft.trim()} type="submit">
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className={styles.signIn}>
          <Link href="/login">Sign in</Link> to leave a comment.
        </p>
      )}

      {status ? <p className={shell.notice}>{status}</p> : null}

      {loading ? (
        <p className={styles.empty}>Loading comments…</p>
      ) : comments.length ? (
        <div className={styles.list}>{comments.map((comment) => renderComment(comment))}</div>
      ) : (
        <p className={styles.empty}>No comments yet. Start the discussion.</p>
      )}
    </section>
  );
}
