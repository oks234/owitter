import { deleteDoc, deleteField, doc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  list,
  ref,
  uploadBytes,
} from "firebase/storage";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import { ITweet } from "./timeline";
import { CancelButton, DeleteButton, EditButton, SaveButton } from "./buttons";
import ButtonLoadingSpinner from "./button-loading-spinner";
import AvatarIcon from "./avatar-icon";

const Wrapper = styled.div`
  display: flex;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  gap: 16px;
`;
const Column = styled.div`
  font-size: 0;
`;
const Photo = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 0.5rem;
`;
const User = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const Avatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: ${(props) => (props.as === "div" ? "1px solid white" : undefined)};
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Username = styled.span`
  font-weight: 600;
  font-size: 15px;
`;
const Payload = styled.p`
  margin: 10px 0px;
  font-size: 18px;
  white-space: pre;
`;
const TextArea = styled.textarea`
  margin: 10px 0px;
  font-size: 18px;
  border: 2px solid white;
  padding: 20px;
  border-radius: 20px;
  font-size: 16px;
  color: white;
  background-color: black;
  width: 100%;
  resize: none;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  &::placeholder {
    font-size: 16px;
  }
  &:focus {
    outline: none;
    border-color: #1d9bf0;
  }
`;

const EditPhoto = styled.div`
  margin-top: 0.375rem;
  display: grid;
  text-align: center;
  gap: 0.5rem;
`;
const EditPhotoLabel = styled(EditButton)`
  background-color: green;

  svg {
    width: 1rem;
  }
`;

const EditPhotoInput = styled.input`
  display: none;
`;

export default function Tweet({ id, userId, username, photo, tweet }: ITweet) {
  const [isLoading, setLoading] = useState(false);
  const [updatingTweet, setUpdatingTweet] = useState(tweet);
  const [updatingPhoto, setUpdatingPhoto] = useState<File | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [avatar, setAvatar] = useState("");
  const user = auth.currentUser;
  const onDelete = async () => {
    if (user?.uid !== userId) return;
    const ok = confirm("Are you sure delete tweet?");
    if (!ok) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, "tweets", id));
      if (photo) {
        const photoRef = ref(storage, `tweets/${user.uid}/${id}`);
        await deleteObject(photoRef);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const onEdit = () => {
    setEditMode(true);
  };
  const onCancel = () => {
    setUpdatingTweet(tweet);
    setEditMode(false);
    setUpdatingPhoto(null);
    setDeletingPhoto(false);
  };
  const onSave: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (user?.uid !== userId) return;
    if (updatingTweet === "") return;
    const ok = confirm("Are you sure update tweet?");
    if (!ok) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, "tweets", id), { tweet: updatingTweet });
      if (updatingPhoto) {
        const locationRef = ref(storage, `tweets/${user.uid}/${id}`);
        const result = await uploadBytes(locationRef, updatingPhoto);
        const url = await getDownloadURL(result.ref);
        await updateDoc(doc(db, "tweets", id), { photo: url });
      }
      if (deletingPhoto) {
        await updateDoc(doc(db, "tweets", id), { photo: deleteField() });
        const locationRef = ref(storage, `tweets/${user.uid}/${id}`);
        await deleteObject(locationRef);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setEditMode(false);
      setLoading(false);
      setUpdatingPhoto(null);
      setDeletingPhoto(false);
    }
  };
  const onPhotoChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { files } = e.target;
    if (files && files.length === 1) {
      if (files[0].size >= Math.pow(10, 6)) {
        alert("Max file size is 1MB.");
        setUpdatingPhoto(null);
        return;
      }
      setUpdatingPhoto(files[0]);
      setDeletingPhoto(false);
    }
  };
  const onDeletePhoto = () => {
    setUpdatingPhoto(null);
    setDeletingPhoto(true);
  };
  const getAvatar = async () => {
    const avatarRefList = await list(ref(storage, "avatars"));
    const avatarRef = avatarRefList.items.find(({ name }) => name === userId);
    if (!avatarRef) return;
    const avatarUrl = await getDownloadURL(avatarRef);
    setAvatar(avatarUrl);
  };
  useEffect(() => {
    getAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Wrapper>
      <Column style={{ flexGrow: 1 }}>
        <User>
          {avatar ? (
            <Avatar src={avatar} />
          ) : (
            <Avatar as="div">
              <AvatarIcon size={16} />
            </Avatar>
          )}
          <Username>{username}</Username>
        </User>
        {editMode ? (
          <form onSubmit={onSave}>
            <TextArea
              disabled={isLoading}
              id="tweet"
              placeholder="tweet"
              name="tweet"
              value={updatingTweet}
              onChange={(e) => {
                setUpdatingTweet(e.target.value);
              }}
            />
            <EditPhotoInput
              id="photo"
              type="file"
              accept="image/*"
              hidden
              disabled={isLoading}
              onChange={onPhotoChange}
            />
            <SaveButton disabled={isLoading} type="submit">
              {isLoading ? <ButtonLoadingSpinner /> : null}
              Save
            </SaveButton>
            <CancelButton disabled={isLoading} onClick={onCancel}>
              Cancel
            </CancelButton>
          </form>
        ) : (
          <>
            <Payload>{tweet}</Payload>
          </>
        )}
        {user?.uid === userId ? (
          <>
            {editMode ? null : (
              <>
                <EditButton disabled={isLoading} onClick={onEdit}>
                  Edit
                </EditButton>
                <DeleteButton disabled={isLoading} onClick={onDelete}>
                  {isLoading ? <ButtonLoadingSpinner /> : null}
                  Delete
                </DeleteButton>
              </>
            )}
          </>
        ) : null}
      </Column>
      <Column>
        {(photo || updatingPhoto) && !deletingPhoto ? (
          <Photo
            src={updatingPhoto ? URL.createObjectURL(updatingPhoto) : photo}
          />
        ) : null}
        {editMode ? (
          <>
            {deletingPhoto && <Photo as="div" src="" />}
            <EditPhoto>
              <EditPhotoLabel as="label" htmlFor="photo">
                {deletingPhoto || !(photo || updatingPhoto)
                  ? "add photo"
                  : "change"}
              </EditPhotoLabel>
              <DeleteButton disabled={isLoading} onClick={onDeletePhoto}>
                delete
              </DeleteButton>
            </EditPhoto>
          </>
        ) : null}
      </Column>
    </Wrapper>
  );
}
