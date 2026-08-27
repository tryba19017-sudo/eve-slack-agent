import { env } from "cloudflare:workers";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import EditorClient from "./EditorClient";
import styles from "./editor.module.css";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const user = await requireChatGPTUser("/editor");
  const editorEmail = String((env as unknown as Record<string, unknown>).SDT_EDITOR_EMAIL ?? "")
    .trim()
    .toLowerCase();

  if (!editorEmail || user.email.trim().toLowerCase() !== editorEmail) {
    return (
      <main className={styles.accessPage}>
        <div className={styles.accessCard}>
          <span>SDT / EDITOR</span>
          <h1>Нет доступа к редактору</h1>
          <p>Вы вошли как {user.email}. Управление сайтом доступно только владельцу.</p>
          <div>
            <a href="/">Вернуться на сайт</a>
            <a href={chatGPTSignOutPath("/editor")}>Выйти</a>
          </div>
        </div>
      </main>
    );
  }

  return <EditorClient userName={user.displayName} />;
}
