import { requireAdmin } from "@/lib/auth/guards";
import { getAllFiles, getAllSubjects } from "@/lib/data";
import { Panel } from "@/components/ui/panel";
import { UploadForm } from "@/components/upload/upload-form";
import { UploadedFilesList } from "@/components/upload/uploaded-files-list";

export default async function UploadPage() {
  await requireAdmin();
  const [subjects, files] = await Promise.all([getAllSubjects(), getAllFiles()]);

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Upload academic file</h2>
        <p className="mt-2 text-sm text-subtle">Any file type is supported. Files are stored in Cloudinary and indexed in Firestore.</p>
        <UploadForm subjects={subjects} />
      </Panel>

      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Uploaded files</h2>
        <UploadedFilesList files={files} />
      </Panel>
    </div>
  );
}
