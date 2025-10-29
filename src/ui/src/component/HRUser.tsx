import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Modal, Box, Typography, Button, Stack, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TextInput from "./TextInput";
import { toast } from "react-toastify";
import axios from "axios";

interface HRUserProps {
  showModal: { open: boolean; title: string }; // Assuming showModal has 'open' and 'title' fields
  setShowModal: Dispatch<SetStateAction<{ open: boolean; title: string }>>; // Function to set modal state
}

const customStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: "30%",
  maxWidth: "60%",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
};

const HRUser: React.FC<HRUserProps> = ({ showModal, setShowModal }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    location_id: "",
    role:"",
    company_id: "",
  });

  useEffect(() => {
    // Fetch logged-in user details from local storage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setForm((prev) => ({
      ...prev,
      company: user.company_details?.name || "", // Autofill company name
      location_id: user.location_id || "",
      role: 'hiring_manager',
      company_id: user.company_id,
    }));
  }, []);

  const setField = (name:any, value:any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateFields = () => {
    if (!form.email) return toast.error("Email cannot be empty");
    if (!form.first_name) return toast.error("First name is required");
    if (!form.last_name) return toast.error("Last name is required");
    return true;
  };

  const registerHandler = async () => {
    if (!validateFields()) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/accounts/register/otp`,
        { user: form }
      );
      toast.success("User added successfully");
      setShowModal({ open: false, title: '' }); // Close modal after success
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <Modal open={showModal.open} onClose={() => setShowModal({ open: false, title: '' })}>
      <Box sx={customStyle}>
        <IconButton
          aria-label="close"
          onClick={() => setShowModal({ open: false, title: '' })}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" gutterBottom>
          Add New User
        </Typography>

        <TextInput
          label="First Name"
          value={form.first_name}
          onChange={(e) => setField("first_name", e.target.value)}
        />
        <TextInput
          label="Last Name"
          value={form.last_name}
          onChange={(e) => setField("last_name", e.target.value)}
        />
        <TextInput
          label="E-mail"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
        />
        <TextInput label="Company" value={form.company} disabled />

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button variant="contained" onClick={registerHandler} sx={{ backgroundColor: "#006251" }}>
            Add User
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
export default HRUser;