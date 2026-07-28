import type { ScimDocument } from "@/lib/scim/schema";
import { serializeScimRadialSvg } from "@/lib/scim/radial-svg";

export function ScimRadialPreview({
  document,
  viewId,
}: {
  document: ScimDocument;
  viewId?: string;
}) {
  try {
    const svg = serializeScimRadialSvg(document, viewId);
    return (
      <div
        className="w-full overflow-hidden rounded-md border bg-white [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  } catch (error) {
    return (
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Unable to render radial view"}
      </p>
    );
  }
}
