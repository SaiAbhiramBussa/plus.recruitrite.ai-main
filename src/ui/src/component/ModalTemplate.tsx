import { getEmployees, shareCreditsAPI } from "@/src/services/common.service";
import { Box, Button, Grid, TextField, Checkbox, Typography } from "@mui/material";
import { NextPage } from "next";
import { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import AppContext from "@/src/context/Context";
import { Dispatch, SetStateAction } from 'react';

interface Employee {
  email: string;
  credits: number;
}

interface NewTemplateProps {
  modalState: Dispatch<SetStateAction<{ open: boolean; title: string; }>>;
  showModal: { open: boolean; title: string };
  refresh: () => void;
}

const NewTemplate:  NextPage<NewTemplateProps>  = ({ modalState, showModal, refresh}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectAll, setSelectAll] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, number>>({});
  const [credits, setCredits] = useState<string>("1");
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const { setScreeningCredits } = useContext(AppContext);
  

  // Fetch employees on component load
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await getEmployees({});
        setEmployees(response?.data["employees"]);
        setTotalCredits(response?.data["total_credits"]);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Handle individual checkbox changes
  const handleCheckboxChange = (email: string) => {
    setSelectedEmployees((prevSelected) => {
      const updatedSelected = { ...prevSelected };
      if (updatedSelected[email]) {
        delete updatedSelected[email]; // Deselect the employee
      } else {
        updatedSelected[email] = Number(credits); // Select the employee
      }

      // Update selectAll status based on whether all employees are selected
      const allSelected = employees.every((emp) => updatedSelected[emp.email]);
      setSelectAll(allSelected);

      return updatedSelected;
    });
  };

  // Handle "Select All" checkbox
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    if (newSelectAll) {
      // Select all employees
      const allSelected = employees.reduce((acc, emp) => {
        acc[emp.email] = Number(credits);
        return acc;
      }, {} as Record<string, number>);
      setSelectedEmployees(allSelected);
    } else {
      // Deselect all employees
      setSelectedEmployees({});
    }
  };

  // Share credits with selected employees
  const handleShareCredits = async () => {
    if (Number(credits) <= 0) {
      toast.error("Credits must be a positive number");
      return;
    }

    // Create array of selected employee emails
    const selectedEmails = Object.keys(selectedEmployees);

    if (selectedEmails.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    const payload = {
      credits: Number(credits),
      emails: selectedEmails,
    };

    try {
    const response = await shareCreditsAPI(payload, {});
      if (response?.status === 200) {
        setScreeningCredits(totalCredits-(Object.keys(selectedEmployees).length * Number(credits)));
        toast.success("Credits shared successfully!");
        modalState({ open: false, title: '' });
        refresh();
      } else {
        toast.error(response?.data?.Message);
      }
    } catch (error:any) {
      if(error?.response){
        if (error.response?.data?.Message) {
          toast.error(error.response.data.Message);
        } else {
          toast.error("Error sharing credits. Please try again later.");
        }
    }
  }
  };

  // Enable or disable Share button
  const isShareButtonEnabled = Number(credits) > 0 && Object.keys(selectedEmployees).length > 0;

  return (
    <Box sx={{ width: "30vw",  }}>
      <Grid container spacing={2}>
        {/* Credits Input */}
        <Grid item xs={12}>
          <TextField
            label="Credits"
            variant="outlined"
            type="number"
            sx={{ fontWeight: "Bold", width: "100%" }}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            error={Number(credits) <= 0}
          />
          {Number(credits) <= 0 && (
            <Box sx={{ color: "red", fontSize: 12, marginTop: "4px" }}>
              Credits must be greater than 0
            </Box>
          )}
        </Grid>

        {/* Employees List */}
        <Box
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "16px",
            marginLeft: "16px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            width: "98%",
            height: "300px",
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
              marginBottom: "16px",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            <span>Select Employees</span>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                checked={selectAll}
                onChange={handleSelectAll}
                indeterminate={
                  Object.keys(selectedEmployees).length > 0 &&
                  Object.keys(selectedEmployees).length < employees.length
                }
              />
              <span style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                Select All
              </span>
            </Box>
          </Box>

          {/* Render Employee List */}
          {employees.map((employee) => (
            <Box
              key={employee.email}
              sx={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={Boolean(selectedEmployees[employee.email])}
                  onChange={() => handleCheckboxChange(employee.email)}
                />
                <span style={{ fontSize: "14px", color: "#333", marginLeft: "8px" }}>
                  {employee.email}
                </span>
              </Box>
              <span style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>
                Credits: {employee.credits || 0}
              </span>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", mt: 2, ml:1 }}>
          <Typography
                  sx={{
                    padding: 1,
                    fontSize: "12px",
                  }}
                  textTransform="uppercase"
                >
                  Total Credits: {totalCredits}
          </Typography>
          <Button
            size="medium"
            onClick={handleShareCredits}
            variant="outlined"
            sx={{
              padding: 1,
              fontSize: 13,
              fontWeight: "bold",
              width: "140px",
            }}
            disabled={!isShareButtonEnabled}
          >
            Share
          </Button>
        </Box>
      </Grid>
    </Box>
  );
};

export default NewTemplate;