import { deleteDoc, deleteField, doc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import { ITweet } from "./timeline";

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

const Button = styled.button`
  color: white;
  font-weight: 600;
  border: 0;
  font-size: 12px;
  padding: 5px 10px;
  text-transform: uppercase;
  border-radius: 5px;
  cursor: pointer;
`;
const CancelButton = styled(Button)`
  background-color: orange;
`;
const DeleteButton = styled(Button)`
  background-color: tomato;
`;
const EditButton = styled(Button)`
  background-color: green;
  margin-right: 0.5rem;
`;
const SaveButton = styled(Button)`
  background-color: blue;
  margin-right: 0.5rem;
`;

const EditPhoto = styled.div`
  margin-top: 0.375rem;
  display: grid;
  text-align: center;
  gap: 0.5rem;
`;
const EditPhotoLabel = styled(Button)`
  /* display: block; */
  /* position: absolute;
  right: 0.25rem;
  top: 0.25rem;
  padding: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center; */
  background-color: green;

  svg {
    width: 1rem;
  }
`;

const EditPhotoInput = styled.input`
  display: none;
`;

const ButtonLoadingSpinner = () => (
  <ClipLoader color="white" size={12} cssOverride={{ marginRight: ".25rem" }} />
);

export default function Tweet({ id, userId, username, photo, tweet }: ITweet) {
  const [isLoading, setLoading] = useState(false);
  const [updatingTweet, setUpdatingTweet] = useState(tweet);
  const [updatingPhoto, setUpdatingPhoto] = useState<File | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [editMode, setEditMode] = useState(false);
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
  return (
    <Wrapper>
      <Column style={{ flexGrow: 1 }}>
        <Username>{username}</Username>
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
