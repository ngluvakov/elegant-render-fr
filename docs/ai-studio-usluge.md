# AI Studio service notes

AI Studio is an assisted image-editing workspace for real estate and interior presentation tasks. It should feel practical: upload an image, choose the target outcome, adjust only the necessary controls, and keep the result with its history.

## Supported tools

| Tool | User-facing purpose | Notes |
| --- | --- | --- |
| Virtual staging | Add furniture and decor to an empty room. | Keep room geometry and natural light believable. |
| Virtual renovation | Show a renovated version of an existing room. | Respect the original camera angle and layout. |
| Item removal | Remove clutter or unwanted objects. | Preserve wall, floor, shadow, and reflection continuity. |
| Day-to-dusk | Convert a daylight exterior to evening. | Keep architectural details visible and avoid over-darkening. |
| Sky replacement | Improve exterior atmosphere. | Match perspective, exposure, and edge detail. |
| Style variation | Explore a different interior style. | Keep fixed architecture unless the user asks otherwise. |
| Object insertion or replacement | Add or replace a specific item using references. | Requires at least one object reference image. |

## Object insertion and replacement

The object flow supports two modes:

- **Add new:** Place a referenced object into the scene.
- **Replace existing:** Replace a selected object; this requires an advanced mask before generation.

Rules:

- Generate is blocked until the base image exists.
- Object workflows require at least one reference image.
- Up to five reference angles can describe the same object.
- With one reference and no mask, show a calm warning that placement is less predictable.
- Replacement mode uses the mask as a soft placement guide and preserves the rest of the image.
- Drag and drop must work for both the base image and object references.
- Repeat with same settings must restore mode, prompt, mask state, and all object references.

## Engine labels

Only show engines that are actually enabled. Current public labels are:

- Nano Banana Pro.
- GPT Image 2.

Do not expose internal model IDs in the user interface.

## Result history

Each completed generation should keep:

- Original image.
- Tool type.
- Prompt and structured options.
- Engine label.
- Reference images when used.
- Mask metadata when used.
- Result image.
- Download link.
- Timestamp.

## Copy style

- Use short labels.
- Prefer verbs: `Upload`, `Generate`, `Download`, `Repeat`.
- Explain blocking states with one sentence.
- Do not promise perfect object fidelity from weak references.
- Avoid playful language in error messages.

## QA checklist

- [ ] Every tool works without a reference panel unless references are required.
- [ ] Object insertion blocks generation until the required inputs exist.
- [ ] Replacement blocks generation until a mask exists.
- [ ] Multi-angle references appear in the processing detail view.
- [ ] Result history and download links persist after refresh.
- [ ] English labels fit on mobile.