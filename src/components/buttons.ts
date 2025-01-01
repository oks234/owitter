import styled from "styled-components";

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
export const CancelButton = styled(Button)`
  background-color: orange;
`;
export const DeleteButton = styled(Button)`
  background-color: tomato;
`;
export const EditButton = styled(Button)`
  background-color: green;
  margin-right: 0.5rem;
`;
export const SaveButton = styled(Button)`
  background-color: blue;
  margin-right: 0.5rem;
`;

export default Button;
