import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";

import { Button } from "./Button.tsx";
import {
createIncidentComment,
getIncidentComments,
} from "../api/commentApis.ts";

export const Comments: React.FC = () => {
const { id } = useParams<{ id: string }>();
const [comment, setComment] = useState("");
const queryClient = useQueryClient();

const commentsQuery = useQuery({
queryKey: ["incident-comments", id],
queryFn: () => getIncidentComments(id as string, 1, 10),
enabled: Boolean(id),
});

const createCommentMutation = useMutation({
mutationFn: (content: string) =>
createIncidentComment(id as string, { content }),
onSuccess: () => {
setComment("");


  queryClient.invalidateQueries({
    queryKey: ["incident-comments", id],
  });
},

});

const comments = commentsQuery.data?.data ?? [];

const handleSubmit = () => {
const content = comment.trim();


if (!content || createCommentMutation.isPending) {
  return;
}

createCommentMutation.mutate(content);

};

return ( <section className="flex h-full min-h-[500px] max-h-[600px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
{/* Header */} <header className="shrink-0 border-b border-zinc-100 px-5 py-4 sm:px-6"> <div className="flex items-center gap-3"> <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100"> <MessageSquare className="h-4 w-4 text-zinc-600" /> </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900">
          Comments
        </h3>

        <p className="mt-0.5 text-xs text-zinc-500">
          Discussion and updates from incident members
        </p>
      </div>
    </div>
  </header>

  {/* Comments */}
  <div className="min-h-0 flex-1 overflow-y-auto">
    {commentsQuery.isLoading ? (
      <div className="space-y-5 px-5 py-5 sm:px-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex gap-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-100" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    ) : commentsQuery.isError ? (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
        <MessageSquare className="mb-3 h-6 w-6 text-zinc-300" />

        <p className="text-sm font-medium text-zinc-700">
          Unable to load comments
        </p>

        <p className="mt-1 text-xs text-zinc-400">
          Please try again later.
        </p>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => commentsQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    ) : comments.length === 0 ? (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
          <MessageSquare className="h-5 w-5 text-zinc-400" />
        </div>

        <p className="mt-3 text-sm font-medium text-zinc-700">
          No comments yet
        </p>

        <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-400">
          Start the discussion by adding the first comment.
        </p>
      </div>
    ) : (
      <div className="divide-y divide-zinc-100">
        {comments.map((item) => (
          <article
            key={item.id}
            className="flex gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/70 sm:px-6"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100">
              <UserRound className="h-4 w-4 text-zinc-500" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-zinc-800">
                  {item.user.name}
                </p>

                <time
                  dateTime={item.createdAt}
                  className="text-xs text-zinc-400"
                >
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </div>

              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600">
                {item.content}
              </p>
            </div>
          </article>
        ))}
      </div>
    )}
  </div>

  {/* Composer */}
  <footer className="shrink-0 border-t border-zinc-200 bg-white p-4 sm:p-5">
    <label
      htmlFor="incident-comment"
      className="mb-2 block text-xs font-medium text-zinc-600"
    >
      Add a comment
    </label>

    <div className="relative">
      <textarea
        id="incident-comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleSubmit();
          }
        }}
        rows={3}
        placeholder="Write a comment..."
        disabled={createCommentMutation.isPending}
        className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 pr-12 text-sm leading-6 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <Button
        type="button"
        size="sm"
        disabled={!comment.trim() || createCommentMutation.isPending}
        onClick={handleSubmit}
        className="absolute bottom-2.5 right-2.5"
        aria-label="Add comment"
      >
        {createCommentMutation.isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>

    <div className="mt-2 flex items-center justify-between">
      <p className="text-[11px] text-zinc-400">
        Use Ctrl + Enter to send
      </p>

      {createCommentMutation.isError && (
        <p className="text-xs text-rose-500">
          Failed to add comment.
        </p>
      )}
    </div>
  </footer>
</section>

);
};
