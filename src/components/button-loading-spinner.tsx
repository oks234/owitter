import ClipLoader from "react-spinners/ClipLoader";
import { LoaderSizeProps } from "react-spinners/helpers/props";

export default function ButtonLoadingSpinner(props: Partial<LoaderSizeProps>) {
  return (
    <ClipLoader
      color="white"
      size={12}
      cssOverride={{ marginRight: ".25rem" }}
      {...props}
    />
  );
}
