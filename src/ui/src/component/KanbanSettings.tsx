import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDeleteLeft,
  faGrip,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "@/src/component/Droppable";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ButtonWrapper from "./ButtonWrapper";

export default function KanbanSettings(props: any) {
  const { listColumns, updateKanban, closeKanbanSettings, companyid, color } =
    props;

  const [lists, setLists] = useState(listColumns);
  const [showNewfield, setShowNewField] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [listTitle, setListTitle] = useState<any>();
  const [updatedVal, setUpdatedVal] = useState<any>();
  const [deleteId, setDeleteId] = useState<any>();
  const [dupList, setDupList] = useState<any>(listColumns);

  const deleteList = (listId: any) => {
    const targetIndex = lists.findIndex((obj: any) => obj.stage_id === listId);

    if (targetIndex !== -1) {
      const updatedObject = { ...lists[targetIndex], is_delete: true };
      const newArray = [
        ...lists.slice(0, targetIndex),
        updatedObject,
        ...lists.slice(targetIndex + 1),
      ];
      const newLists = dupList.filter((list: any) => list.stage_id !== listId);
      setDupList(newLists);
      setLists(newArray);
    }
  };

  const createList = () => {
    setShowNewField(true);
  };

  const saveChanges = () => {};

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    setUpdatedVal(result.destination.index);

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const updatedStages = Array.from(dupList);
    const [draggedStage] = updatedStages.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      updatedStages.splice(destination.index, 0, draggedStage);
    } else {
      const targetStages = Array.from(dupList);
      targetStages.splice(destination.index, 0, draggedStage);

      updatedStages.splice(source.index, 1, ...targetStages);
    }

    // Update the stage_order based on the new arrangement
    const updatedStagesWithOrder = updatedStages.map((list: any, index) => ({
      ...list,
      stage_order: index + 1,
    }));

    setLists(updatedStagesWithOrder);
    setDupList(updatedStagesWithOrder);

    // const items = Array.from(listColumns);
    // const [reorderedItem] = items.splice(result.source.index, 1);
    // items.splice(result.destination.index, 0, reorderedItem);

    // setLists(items);
  };

  const saveChangesHandler = async () => {
    if (listTitle) {
      const updatedArray = [
        ...lists,
        {
          id: "8",
          type: listTitle.toLowerCase(),
          title: listTitle,
          candidates: [],
        },
      ];
      const jsonString = JSON.stringify(updatedArray);
      setLists(updatedArray);
      localStorage.setItem("kanban", jsonString);
      setListTitle(" ");
      setShowNewField(false);
      updateKanban(updatedArray);
    }

    let res = await axios.put(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/kanban-board`,
      lists,
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success("Board configured successfully!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      setLists(res.data);
      updateKanban(lists);
    } else {
      toast.success("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
    closeKanbanSettings();
  };

  const updateListHandler = (e: any, index: number) => {
    const updatedLists = [...lists];
    updatedLists[index].stage_name = e.target.value;
    setLists(updatedLists);
  };

  const addColumnHandler = () => {
    const obj = {
      stage_name: listTitle,
      stage_order: lists[lists.length - 1].stage_order + 1,
    };
    const newObj = [...lists, obj];
    setLists(newObj);
    setDupList(newObj);
    setShowNewField(false);
    setListTitle("");
  };

  return (
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="mt-6">
          <StrictModeDroppable droppableId="characters" type="card">
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {dupList &&
                  dupList.map(
                    (list: any, iIndex: any) =>
                      iIndex > 1 && (
                        <Draggable
                          key={list.stage_order}
                          draggableId={list.stage_order.toString()}
                          index={iIndex}
                        >
                          {(provided) => (
                            <div
                              className="kanban-card"
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              <div
                                key={list.id}
                                className="outline-none border p-2 w-full flex justify-between items-center"
                              >
                                <div className="flex items-center">
                                  <FontAwesomeIcon
                                    style={{ color: color?.primaryAccent }}
                                    icon={faGrip}
                                    className="h-3 mr-2 cursor-pointer"
                                    onClick={() => deleteList(list.stage_id)}
                                  />
                                  <input
                                    name="list"
                                    type="text"
                                    value={dupList[iIndex].stage_name}
                                    placeholder={dupList[iIndex].stage_name}
                                    className="outline-none"
                                    onChange={(e: any) =>
                                      updateListHandler(e, iIndex)
                                    }
                                  />
                                </div>
                                <FontAwesomeIcon
                                  style={{ color: color?.primaryAccent }}
                                  icon={faDeleteLeft}
                                  className="h-6 cursor-pointer"
                                  onClick={() => deleteList(list.stage_id)}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                  )}
              </div>
            )}
          </StrictModeDroppable>
          {showNewfield && (
            <div className="outline-none border p-2 w-full flex justify-between items-center">
              <div>
                <FontAwesomeIcon
                  style={{ color: color?.primaryAccent }}
                  icon={faGrip}
                  className="h-3 mr-2 cursor-pointer"
                  onClick={() => deleteList(lists.id)}
                />
                <input
                  name="list"
                  type="text"
                  onBlur={addColumnHandler}
                  value={listTitle}
                  placeholder={listTitle ? listTitle : "New list title"}
                  className="outline-none"
                  onChange={(e: any) => setListTitle(e.target.value)}
                />
              </div>
              <FontAwesomeIcon
                style={{ color: color?.primaryAccent }}
                icon={faDeleteLeft}
                className="h-6 cursor-pointer"
                onClick={() => setShowNewField(false)}
              />
            </div>
          )}
          <div className="flex items-center justify-end mt-4">
            <div>
              <ButtonWrapper
                onClick={saveChangesHandler}
                classNames="disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-4 py-2 text-base font-medium shadow-sm focus:outline-none mt-4"
              >
                Save changes
              </ButtonWrapper>
            </div>
            <div className="ml-4">
              <ButtonWrapper
                onClick={createList}
                classNames="disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-4 py-2 text-base font-medium shadow-sm focus:outline-none mt-4"
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  className="font-thin h-4 mr-2 cursor-pointer"
                />
                Create list
              </ButtonWrapper>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
