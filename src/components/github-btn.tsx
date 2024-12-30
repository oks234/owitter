import { GithubAuthProvider, signInWithPopup } from "firebase/auth";
import styled from "styled-components";
import { auth } from "../firebase";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";

const Button = styled.button`
  margin-top: 50px;
  background-color: white;
  font-weight: 500;
  width: 100%;
  color: black;
  padding: 10px 20px;
  border-radius: 50px;
  border: 0;
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Logo = styled.img`
  height: 24px;
`;

export default function GithubButton() {
  const navigate = useNavigate();
  const onClick = async () => {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.log(error.message);
      }
    }
  };
  return (
    <Button onClick={onClick}>
      <Logo src="/github-logo.svg" />
      Continue with Guthub
    </Button>
  );
}
