"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export function RichTextEditor({
    value,
    onChange,
}: {
    value: string;
    onChange: (html: string) => void;
}) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        // Avoid SSR hydration mismatches in Next.js by not immediately rendering on the server
        immediatelyRender: false,
    });

    // Sync editor when editing existing tickets
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [value, editor]);

    return (
        <div className="border rounded">
            <div className="flex gap-2 border-b p-2 text-sm">
                <button onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
                <button onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
                <button onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
                    H3
                </button>
            </div>

            {editor && (
                <EditorContent
                    editor={editor}
                    className="prose prose-sm p-2"
                />
            )}
        </div>
    );
}
