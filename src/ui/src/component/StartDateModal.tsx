import Modal from "@mui/material/Modal";
import { Box, Typography, Button } from "@mui/material";

const customStyle = {
  position: "absolute",
  top: "45%",
  bottom: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: "20%",
  maxWidth: "60%",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 1,
  zIndex: 2,
  minHeight: "25vh",
  maxHeight: "80vh",
  height: "fit-content",
  overflowY: "auto",
  padding: "10px",

  "&::-webkit-scrollbar": {
    display: "none",
  },
};

export const PoweredByModal = (Props: any) => {
  const { heading, children, showModal, setShowModal, footer, } = Props;
  const handleClose = () => {
    setShowModal({open:false, title:''});
  };
  return (
    <Box>
      <Modal
        open={showModal.open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        disableAutoFocus
        disableEnforceFocus
      >
        <Box sx={customStyle}>
          {showModal.title && (
            <>
              <Box
                sx={{
                  display: "flex",
                  padding: 1,
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  textTransform="uppercase"
                >
                  {showModal.title}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowModal(false)}
                  sx={{color:"#000000"}}
                >
                    <b>X</b>
                </Button>
              </Box>
            </>
          )}
          <Box sx={{ padding: 1 }}>{children}</Box>
          {footer && (
            <Box
              sx={{
                position: "absolute",
                bottom: "2%",
                right: "2%",
                padding: 1,
              }}
            >
              {footer}
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};