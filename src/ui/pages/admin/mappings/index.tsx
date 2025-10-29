import { useContext, useEffect, useState } from "react";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import _ from "lodash";
import Loader from "@/src/component/Loader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileImport,
  faPlus,
  faSave,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import MappingCard from "@/src/component/mappings/mappingCard";
import BigMappingCard from "@/src/component/mappings/bigMappingCard";
import Modal from "@/src/component/Modal";
import { getAllJobTitles, newJobTitle } from "@/src/services/common.service";
import TextInput from "@/src/component/TextInput";
import { showErrorToast, showSuccessToast } from "@/src/common/common.util";
import AppContext from "@/src/context/Context";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

const AdminMappingsDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingsData, setMappingsData] = useState<any>({});
  const [showTitlesCard, setShowTitlesCard] = useState<any>();
  const [isCreateJobTitleModalOpened, setIsCreateJobTitleModalOpened] =
    useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [allJobTitles, setAllJobTitles] = useState<Array<any>>([]);
  const { color } = useContext(AppContext);

  useEffect(() => {
    getMappingsForAdmin(true);
  }, []);

  useEffect(() => {
    if (searchTerm != undefined) {
      const debounceMappingsSearch = _.debounce(getMappingsForAdmin, 1000);
      debounceMappingsSearch();
      return () => {
        debounceMappingsSearch.cancel();
      };
    }
  }, [searchTerm]);

  const getMappingsForAdmin = async (isSetAllJobTitles: boolean = false) => {
    setLoading(true);
    setMappingsData(null);
    getAllJobTitles(searchTerm)
      .then((result: any) => {
        if (result.status === 200) {
          setMappingsData(result.data);
          if (isSetAllJobTitles) {
            setAllJobTitles(result.data);
          }
          setShowTitlesCard(null);
        }
      })
      .finally(() => setLoading(false));
  };

  const refreshMappings = (data: Array<any>) => {
    _.forEach(mappingsData, (mapping: any) => {
      if (_.get(data, "id") == mapping.id) {
        _.set(
          mapping,
          "future_title_mappings",
          _.size(_.get(data, "future_mappings"))
        );
        _.set(
          mapping,
          "past_title_mappings",
          _.size(_.get(data, "past_mappings"))
        );
      }
    });
    setMappingsData([...mappingsData]);
  };

  const refreshMappingsData = (id: string, deleteType: string) => {
    let newMappingsData = mappingsData;
    switch (deleteType) {
      case "delete":
        newMappingsData = _.filter(
          newMappingsData,
          (mapping: any) => mapping.id != id
        );
        break;
      case "clear":
        _.forEach(newMappingsData, (mapping: any) => {
          if (mapping.id == id) {
            _.set(mapping, "future_title_mappings", 0);
            _.set(mapping, "past_title_mappings", 0);
          }
        });
        break;
    }
    setMappingsData([...newMappingsData]);
  };

  const handleImport = () => {
    return;
  };

  const handleCardClick = (item: any) => {
    if (item.id == showTitlesCard?.id) {
      setShowTitlesCard(null);
      return;
    }
    setShowTitlesCard(item);
  };

  const isJobTitleAlreadyExist = (newTitle: string): boolean => {
    if (!newTitle) {
      return true;
    }
    let isJobTitleAlreadyExist = false;
    _.forEach(allJobTitles, (title: any) => {
      if (!isJobTitleAlreadyExist) {
        isJobTitleAlreadyExist = _.isEqual(title.title, newTitle);
      }
    });
    return isJobTitleAlreadyExist;
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader companyName="Admin" />
      </div>

      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col w-full grow min-h-full px-6"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col w-full h-full min-h-[89vh] relative my-6 rounded-md"
        >
          <div className="flex w-full justify-between items-center px-4">
            <div className="text-lg font-bold cursor-pointer w-fit">
              Job Title Mapping
            </div>
            <div className="flex items-center py-4 gap-3">
              <div
                style={{ borderColor: color?.outerBg }}
                className="flex gap-3 items-center border w-64 rounded"
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{ borderColor: color?.outerBg }}
                  className="px-3 border-r"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm w-32 md:mr-4 py-2 pr-3 rounded border-0 focus:outline-none focus:border-0"
                  placeholder="Search titles"
                />
              </div>
              <ButtonWrapper
                onClick={handleImport}
                classNames="flex items-center gap-2 justify-center rounded border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none"
              >
                <FontAwesomeIcon icon={faFileImport} />
                <span className="hidden lg:block">Import</span>
              </ButtonWrapper>
              <ButtonWrapper
                onClick={() => {
                  setIsCreateJobTitleModalOpened(true);
                }}
                classNames="flex items-center gap-2 justify-center rounded border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="hidden lg:block">Create Job Title</span>
              </ButtonWrapper>
            </div>
          </div>
          <div>
            <div>
              {loading ? (
                <div className="mt-[10%]">
                  <Loader />
                </div>
              ) : (
                <>
                  {mappingsData?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 px-4 mb-28 md:mb-16">
                      <div
                        className={
                          showTitlesCard
                            ? "grid grid-cols-2 gap-4 col-span-2"
                            : "grid grid-cols-3 gap-4 col-span-3"
                        }
                      >
                        {mappingsData.map((item: any, key: any) => (
                          <div
                            key={item.id}
                            className="col-span-1 cursor-pointer"
                            onClick={() => handleCardClick(item)}
                          >
                            <MappingCard
                              refresh={refreshMappingsData}
                              isSelected={
                                _.get(item, "id") == _.get(showTitlesCard, "id")
                              }
                              id={item.id}
                              jobTitle={item.title}
                              futureTitlesCount={item.future_title_mappings}
                              pastTitlesCount={item.past_title_mappings}
                            />
                          </div>
                        ))}
                      </div>
                      {showTitlesCard?.id && (
                        <BigMappingCard
                          id={showTitlesCard.id}
                          refreshMappings={refreshMappings}
                        />
                      )}
                    </div>
                  ) : (
                    <div
                      style={{ color: color?.primaryAccent }}
                      className="h-[70vh] flex items-center justify-center font-bold"
                    >
                      No Mappings found
                    </div>
                  )}
                </>
              )}
            </div>
            <div></div>
          </div>
        </div>
      </div>
      <Modal
        open={isCreateJobTitleModalOpened}
        setOpen={setIsCreateJobTitleModalOpened}
        header="Create Job Title"
      >
        <div className="flex flex-col gap-6">
          <div className="">
            <TextInput
              label={"Job Titles"}
              section="admin"
              value={newTitle}
              placeholder={"Enter Job Title"}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end">
            <div>
              <ButtonWrapper
                disabled={isJobTitleAlreadyExist(newTitle)}
                onClick={() => {
                  newJobTitle({ job_title: newTitle }).then((resp: any) => {
                    if (!_.isEmpty(resp.data)) {
                      let newJobTitle = {
                        future_title_mappings: 0,
                        id: resp.data.id,
                        past_title_mappings: 0,
                        title: resp.data.job_title,
                      };
                      setMappingsData([newJobTitle, ...mappingsData]);
                      setAllJobTitles(() => [newJobTitle, ...allJobTitles]);
                      showSuccessToast("New Title Added");
                    } else {
                      showErrorToast("Unable to create new job title");
                    }
                    setIsCreateJobTitleModalOpened(false);
                    setNewTitle("");
                  });
                }}
                classNames="flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-sm font-medium text-white shadow-sm focus:outline-none mt-4"
              >
                <FontAwesomeIcon
                  icon={faSave}
                  className="h-4 mr-1 cursor-pointer"
                />
                <span className="mx-1 hidden lg:block">{"Save"}</span>
              </ButtonWrapper>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AuthGuard(AdminMappingsDashboard);
