import { faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import Modal from "../Modal";

import countries from "i18n-iso-countries";
import { toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import Location from "../create-company/location";
import _ from "lodash";
import Loader from "../Loader";

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const Locations = (props: any) => {
  const { companyid, setIsEdit, isEdit, color } = props;

  const [locationForm, setLocationForm] = useState<any>();
  const [locationFormData, setLocationFormData] = useState<any>();
  const [locationId, setLocationId] = useState<any>();
  const [locations, setLocations] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<any>();
  const [showAddLocationModal, setShowAddLocationModal] =
    useState<boolean>(false);
  const [confirmDeleteLocation, setConfirmDeleteLocation] =
    useState<boolean>(false);

  useEffect(() => {
    companyid && fetchLocations();
  }, [companyid]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/`,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        setLocations(response.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  locations?.length > 0 &&
    locations.map((item: any, key: any) => {
      const addressParts = _.compact([item?.state, item?.city, item?.address]);
      const formattedAddress = _.join(addressParts, ", ");
    });

  const deleteLocation = async (locationId: any) => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/${locationId}/`,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        setConfirmDeleteLocation(false);
        toast.success(response.data.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        const locationsArr = locations.filter(
          (location: any) => location.id !== locationId
        );
        setLocations(locationsArr);
      }
    } catch (err: any) {
      toast.error(err?.message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 10000,
        hideProgressBar: true,
      });
    }
  };

  const addLocation = async (locationForm: any) => {
    if (locationForm) {
      setLocationFormData(locationForm);
      locationForm.country = locationForm.country.name;
      locationForm.state = locationForm.state.name;
      locationForm.company_id = companyid;
      const locationRes = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/`,
        locationForm,
        {
          withCredentials: true,
        }
      );
      if (locationRes.status === 200) {
        setLocationId(locationRes.data?.id);
        toast.success("Location created successfully", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        fetchLocations();
        setShowAddLocationModal(false);
      }
    }
  };

  const openLocationEditModal = async (locationItem: any) => {
    setLocationForm(locationItem);
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/${locationItem.id}/`,
      {
        withCredentials: true,
      }
    );
    if (response.status === 200) {
      locationItem = response.data;
    }
    locationItem.country = countries.getName(locationItem.country, "en");
    setLocationForm(locationItem);
    setShowAddLocationModal(true);
    setIsEdit(true);
  };

  return (
    <div className="creators p-4">
      <div className="head w-full m-auto flex px-3 py-1 rounded-md">
        <div className="flex items-center">
          <Image
            className="mb-1 mr-2 mt-1"
            src={"/Images/h1-icon.png"}
            alt="company logo"
            height={16}
            width={16}
          />
          <p className="ml-3 font-semibold">Locations</p>
        </div>
        <button
          style={{ color: color?.primaryAccent }}
          onClick={() => {
            setLocationForm({});
            setShowAddLocationModal(true);
          }}
          className="flex items-center justify-center rounded border border-transparent px-2 py-1 text-sm font-medium shadow-sm focus:outline-none"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 cursor-pointer" />
        </button>
      </div>
      <div className="table w-full">
        <div className="">
          {loading ? (
            <div className="h-[50vh] flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <table className="table-auto w-full">
              <thead className="sticky top-0 border-b">
                <tr>
                  <th className="w-3/12 py-4 text-left">City</th>
                  <th className="w-3/12 text-left">State</th>
                  <th className="w-3/12 py-4 text-left">Country</th>
                  <th className="w-3/12 py-4 text-left pl-2">Address</th>
                </tr>
              </thead>
              {locations && (
                <tbody className="h-10 min-h-full overflow-auto">
                  {locations?.length > 0 &&
                    locations.map((item: any, key: any) => {
                      const addressParts = _.compact([
                        item?.state,
                        item?.city,
                        item?.address,
                      ]);
                      const formattedAddress = _.join(addressParts, ", ");
                      return (
                        <tr
                          key={key}
                          className="h-12 items-center table-row w-full border-b"
                        >
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.city ? item.city : "-"}
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.state ? item.state : "-"}
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.country ? item.country : "-"}
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.address ? item.address : "-"}
                            </div>
                          </td>
                          <td>
                            <button
                              style={{ color: color?.primaryAccent }}
                              className="ml-6 mr-2"
                              onClick={() => openLocationEditModal(item)}
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="h-4 mr-1 cursor-pointer"
                              />
                            </button>
                          </td>
                          <td>
                            <button
                              style={{ color: color?.primaryAccent }}
                              onClick={() => {
                                setDeleteItem(item);
                                setConfirmDeleteLocation(true);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="h-4 mr-2 cursor-pointer"
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              )}
            </table>
          )}
          <Modal
            open={confirmDeleteLocation}
            setOpen={setConfirmDeleteLocation}
            header="Confirmation"
          >
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-md">
                Are you sure you want to delete this location?
              </div>

              <div className="flex items-center justify-end">
                <div className="ml-4">
                  <button
                    type="button"
                    style={{ color: color?.btnAccent }}
                    className="disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4  bg-red-500 hover:bg-red-400 disabled:bg-red-200"
                    onClick={() => deleteLocation(deleteItem.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal
            overflow={true}
            open={showAddLocationModal}
            setOpen={setShowAddLocationModal}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            header="Add Location"
          >
            <Location
              locations={locations}
              setLocations={setLocations}
              companyid={companyid}
              isEdit={isEdit}
              setIsEdit={setIsEdit}
              modal={true}
              setShowAddLocationModal={setShowAddLocationModal}
              addLocation={addLocation}
              locationForm={locationForm}
              setLocationForm={setLocationForm}
              color={color}
            />
          </Modal>
          {!locations?.length && (
            <div className="flex justify-center mt-6">
              <div>No locations found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Locations;
