import { TranslationEditor } from "@/components/loki/translation-editor";

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    owner?: string;
    repo?: string;
    branch?: string;
    installationId?: string;
    subProjectRootPath?: string;
    subProjectName?: string;
  }>;
}) {
  const { owner, repo, branch, installationId, subProjectRootPath, subProjectName } =
    await searchParams;

  return (
    <TranslationEditor
      owner={owner}
      repo={repo}
      branch={branch ?? "main"}
      installationId={installationId ? Number(installationId) : undefined}
      subProjectRootPath={subProjectRootPath}
      subProjectName={subProjectName}
    />
  );
}
