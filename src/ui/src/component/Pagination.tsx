import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useState, useEffect, useContext } from "react";
import Select from "react-select";
import AppContext from "../context/Context";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { Option } from "@/src/common/common.comp";

const PageRangeOption = [
  {
    key: 0,
    value: 50,
  },
  {
    key: 1,
    value: 100,
  },
  {
    key: 2,
    value: 200,
  },
];

export default function Pagination(props: any) {
  const {
    totalItems,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    totalPages,
    PageNumberChange,
    PerPageNumberChange,
    perPagingNumber,
    setPerPagingNumber,
    setPageNumber,
  } = props;

  const [currPage, setCurrPage] = useState(1);
  const [changed, setChanged] = useState(false);
  const { color, customStyles } = useContext(AppContext);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const page = Number(searchParams.get("page"));
  const perPage = Number(searchParams.get("perPage"));
  const router = useRouter();
  const [perPageRange, setPerPageRange] = useState<any>(PageRangeOption);

  useEffect(() => {
    if (changed || !currPage || !perPage) {
      router.push(`${pathname}?page=${currPage}&perPage=${perPagingNumber}`);
      setChanged(false);
      return;
    }

    if (page && perPage) {
      PageNumberChange(page);
      PerPageNumberChange(perPage);
      setCurrPage(page);
      setPerPagingNumber(perPage);

      setPerPageRange(() => {
        const isFound = PageRangeOption.find((item) => item.value === perPage);

        if (!isFound) {
          return [
            ...PageRangeOption,
            {
              key: PageRangeOption.length,
              value: perPage,
            },
          ].sort((a, b) => a.value - b.value);
        } else {
          return PageRangeOption;
        }
      });

      router.replace(`${pathname}?page=${page}&perPage=${perPage}`);
    }
  }, [page, perPage, currPage, perPagingNumber]);

  const handleClick = (pageNumber: any) => {
    PageNumberChange(pageNumber);
    setCurrPage(pageNumber);
    setChanged(true);
  };

  useEffect(() => {
    if (setCurrentPage != null) {
      setCurrPage(Number(setCurrentPage));
    }
  }, [setCurrentPage]);

  const handleSelect = (perPageNumber: any) => {
    setCurrPage(1);
    setPageNumber(1);
    setPerPagingNumber(perPageNumber.value);
    PerPageNumberChange(perPageNumber.value);
    setChanged(true);
  };

  const getOptionLabel = (option: any) => option.value;

  let pages;

  if (totalPages <= 5) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (currPage <= 3) {
      pages = [1, 2, 3, 4, 5];
    } else if (currPage > totalPages - 3) {
      pages = [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    } else {
      pages = [
        currPage - 2,
        currPage - 1,
        currPage,
        currPage + 1,
        currPage + 2,
      ];
    }
  }
  const prevPage = currPage === 1 ? null : currPage - 1;
  const nextPage = currPage === totalPages ? null : currPage + 1;

  return (
    <div
      style={{
        backgroundColor: color?.innerBg,
        color: color?.primaryAccent,
      }}
      className="flex items-center justify-between px-2 py-3 sm:px-6"
    >
      <div className="justify-center flex flex-wrap sm:flex-1 sm:items-center sm:justify-center">
        <div>
          <p className="text-sm">
            {itemsPerPage * (currPage - 1) + 1} -{" "}
            {totalPages == currPage ? totalItems : itemsPerPage * currPage} of{" "}
            {parseInt(totalItems || 0).toLocaleString("en-US")}
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm ml-4"
            aria-label="Pagination"
          >
            <button
              onClick={() => handleClick(prevPage)}
              disabled={prevPage === null ? true : false}
              className="relative inline-flex items-center hover:opacity-75 disabled:opacity-40 rounded-l-md px-2 py-2 ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Previous</span>
            </button>

            {pages.map((pageNumber) => (
              <button
                key={pageNumber}
                style={
                  currentPage == pageNumber
                    ? {
                        backgroundColor: color?.outerBg,
                        borderColor: color?.outerBg,
                      }
                    : {
                        backgroundColor: color?.innerBg,
                        borderColor: color?.outerBg,
                      }
                }
                onClick={() => handleClick(pageNumber)}
                aria-current={pageNumber == currentPage ? "page" : undefined}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium border focus:z-10 focus:outline-offset-0 focus:ring-1 focus:ring-offset-1"
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => handleClick(nextPage)}
              disabled={nextPage === null ? true : false}
              className="relative inline-flex hover:opacity-75 disabled:opacity-40 items-center rounded-r-md px-2 py-2 ring-1 ring-inset focus:z-20 focus:outline-offset-0"
            >
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Next</span>
            </button>
          </nav>
        </div>
        <div className="text-sm flex items-center ml-4">
          Per Page
          <Select
            options={perPageRange}
            getOptionLabel={getOptionLabel}
            isDisabled={totalItems < 50}
            className="ml-2"
            menuPlacement="auto"
            components={{ Option }}
            styles={customStyles}
            placeholder={perPagingNumber}
            value={perPageRange.find(
              (option: any) => option.value === perPagingNumber
            )}
            onChange={(e) => handleSelect(e)}
          />
        </div>
      </div>
    </div>
  );
}
