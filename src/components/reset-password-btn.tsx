import { Link } from "react-router-dom";
import { Switcher } from "./auth-components";

export default function ResetPasswordBtn() {
  return (
    <Switcher>
      Forgot password? <Link to="/reset-password">Reset Password &rarr;</Link>
    </Switcher>
  );
}
