import React, { useState } from "react";
import { MessageSquare, Send, UserRound } from "lucide-react";
import { Button } from "./Button.tsx";

type IncidentComment = {
  id: string;
  author: string;
  comment: string;
  timestamp: string;
};

const comments: IncidentComment[] = [
  {
    id: "1",
    author: "Jane Smith",
    comment:
      "Investigating the issue now. I will add an update once we identify the root cause.",
    timestamp: "Today, 10:28 AM",
  },
  {
    id: "2",
    author: "John Doe",
    comment:
      "The affected service has been identified and the team is working on mitigation.",
    timestamp: "Today, 9:56 AM",
  },
  {
    id: "3",
    author: "Mike Johnson",
    comment:
      "Monitoring the service closely. No additional impact has been reported so far.",
    timestamp: "Today, 9:42 AM",
  },
];

export const Comments: React.FC = () => {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!comment.trim()) return;

    // API integration will go here later.
    console.log("New comment:", comment);

    setComment("");
  };

  return (
    <section className="flex h-full max-h-[600px] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
            <MessageSquare className="h-4 w-4 text-zinc-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Comments
            </h3>

            <p className="mt-0.5 text-xs text-zinc-500">
              Discussion and updates from incident members
            </p>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-zinc-100">
          {comments.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 px-5 py-4 sm:px-6"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                <UserRound className="h-4 w-4 text-zinc-500" />
              </div>

              {/* Comment */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-800">
                    {item.author}
                  </p>

                  <time className="text-xs text-zinc-400">
                    {item.timestamp}
                  </time>
                </div>

                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {item.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed comment composer */}
      <div className="shrink-0 border-t border-zinc-200 bg-white p-4 sm:p-5">
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
            rows={3}
            placeholder="Write a comment..."
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 pr-12 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100"
          />

          <Button
            type="button"
            size="sm"
            disabled={!comment.trim()}
            onClick={handleSubmit}
            className="absolute bottom-2 right-2"
            aria-label="Add comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
