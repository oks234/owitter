import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import { useEffect, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { ITweet } from "../components/timeline";
import Tweet from "../components/tweet";
import { EditButton, SaveButton } from "../components/buttons";
import { Input } from "../components/auth-components";
import ButtonLoadingSpinner from "../components/button-loading-spinner";
import AvatarIcon from "../components/avatar-icon";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;
`;
const AvatarUpload = styled.label`
  width: 80px;
  overflow: hidden;
  height: 80px;
  border-radius: 50%;
  border: 2px solid white;
  /* background-color: #1d9bf0; */
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 50px;
  }
`;
const AvatarImg = styled.img`
  width: 100%;
`;
const AvatarInput = styled.input`
  display: none;
`;
const Name = styled.div`
  font-size: 22px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const Tweets = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 10px;
`;
const NameForm = styled.form`
  display: flex;
  gap: 0.5rem;

  button {
    flex-shrink: 0;
  }
`;

export default function Profile() {
  let user = auth.currentUser;
  const [isLoading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(user?.photoURL);
  const [tweets, setTweets] = useState<ITweet[]>([]);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const onAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const { files } = event.target;
    if (user === null) return;
    if (files && files.length === 1) {
      const file = files[0];
      const locationRef = ref(storage, `avatars/${user.uid}`);
      const result = await uploadBytes(locationRef, file);
      const avatarUrl = await getDownloadURL(result.ref);
      setAvatar(avatarUrl);
      await updateProfile(user, { photoURL: avatarUrl });
    }
  };
  const fetchTweets = async () => {
    const tweetQuery = query(
      collection(db, "tweets"),
      where("userId", "==", user?.uid),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const snapshot = await getDocs(tweetQuery);
    const tweets = snapshot.docs.map((doc) => {
      const { tweet, createdAt, userId, username, photo } = doc.data();
      return { tweet, createdAt, userId, username, photo, id: doc.id };
    });
    setTweets(tweets);
  };
  const onNameSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();
    if (user === null || name === "") return;
    if (name === user.displayName) {
      alert("Same as previous name.");
      return;
    }
    const ok = confirm("Are you sure update name?");
    if (!ok) return;
    try {
      setLoading(true);
      await updateProfile(user, { displayName: name });
      user = auth.currentUser;
    } catch (error) {
      console.log(error);
    } finally {
      setEditName(false);
      setLoading(false);
    }
  };
  const onNameInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setName(event.target.value);
  };
  const onEditNameButtonClick = () => {
    if (user === null) return;
    setEditName(true);
    setName(user.displayName ?? "");
  };
  useEffect(() => {
    fetchTweets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Wrapper>
      <AvatarUpload
        htmlFor="avatar"
        style={avatar ? { backgroundColor: "transparent" } : undefined}
      >
        {avatar ? <AvatarImg src={avatar} /> : <AvatarIcon size={50} />}
      </AvatarUpload>
      <AvatarInput
        id="avatar"
        type="file"
        accept="image/*"
        onChange={onAvatarChange}
      />
      <>
        {editName ? (
          <NameForm onSubmit={onNameSubmit}>
            <Input
              id="name"
              type="text"
              placeholder="name"
              value={name}
              onChange={onNameInputChange}
            />{" "}
            <SaveButton type="submit" disabled={isLoading}>
              {isLoading ? <ButtonLoadingSpinner /> : null} Save
            </SaveButton>
          </NameForm>
        ) : (
          <Name>
            {user?.displayName ?? "Anonymous"}{" "}
            <EditButton onClick={onEditNameButtonClick}>Edit</EditButton>
          </Name>
        )}
      </>

      <Tweets>
        {tweets.map((tweet) => (
          <Tweet key={tweet.id} {...tweet} />
        ))}
      </Tweets>
    </Wrapper>
  );
}
