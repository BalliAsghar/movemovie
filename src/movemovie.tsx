import { showToast, Toast } from "@raycast/api";
import { authorize, runScript } from "./Auth";
export default async function Command() {
  await authorize();
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Moving Movie",
  });
  await runScript();
  toast.style = Toast.Style.Success;
  toast.title = "Movie Moved, if it was there";
}
