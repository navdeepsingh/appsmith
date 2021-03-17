export default {
  getSelectedRow: (props) => {
    const selectedRowIndex =
      props.selectedRowIndex === undefined ||
      Number.isNaN(parseInt(props.selectedRowIndex))
        ? -1
        : parseInt(props.selectedRowIndex);
    const filteredTableData =
      props.filteredTableData || props.sanitizedTableData || [];
    if (selectedRowIndex === -1) {
      const emptyRow = { ...filteredTableData[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }
    const selectedRow = { ...filteredTableData[selectedRowIndex] };
    return selectedRow;
  },
  //
  getSelectedRows: (props) => {
    const selectedRowIndices = props.selectedRowIndices || [];
    const filteredTableData =
      props.filteredTableData || props.sanitizedTableData || [];

    const selectedRows = selectedRowIndices.map(
      (ind) => filteredTableData[ind],
    );
    return selectedRows;
  },
  //
  getPageSize: (props) => {
    const TABLE_SIZES = {
      DEFAULT: {
        COLUMN_HEADER_HEIGHT: 38,
        TABLE_HEADER_HEIGHT: 42,
        ROW_HEIGHT: 40,
        ROW_FONT_SIZE: 14,
      },
      SHORT: {
        COLUMN_HEADER_HEIGHT: 38,
        TABLE_HEADER_HEIGHT: 42,
        ROW_HEIGHT: 20,
        ROW_FONT_SIZE: 12,
      },
      TALL: {
        COLUMN_HEADER_HEIGHT: 38,
        TABLE_HEADER_HEIGHT: 42,
        ROW_HEIGHT: 60,
        ROW_FONT_SIZE: 18,
      },
    };
    const compactMode = props.compactMode || "DEFAULT";
    const componentHeight =
      (props.bottomRow - props.topRow) * props.parentRowSpace;
    const tableSizes = TABLE_SIZES[compactMode];
    let pageSize = Math.floor(
      (componentHeight -
        tableSizes.TABLE_HEADER_HEIGHT -
        tableSizes.COLUMN_HEADER_HEIGHT) /
        tableSizes.ROW_HEIGHT,
    );
    if (
      componentHeight -
        (tableSizes.TABLE_HEADER_HEIGHT +
          tableSizes.COLUMN_HEADER_HEIGHT +
          tableSizes.ROW_HEIGHT * pageSize) >
      0
    ) {
      pageSize += 1;
    }
    return pageSize;
  },
  //
  getSanitizedTableData: (props) => {
    const separatorRegex = /\W+/;

    if (props.tableData && Array.isArray(props.tableData)) {
      return props.tableData.map((entry) => {
        const sanitizedData = {};

        for (const [key, value] of Object.entries(entry)) {
          const sanitizedKey = key
            .split(separatorRegex)
            .join("_")
            .slice(0, 200);
          sanitizedData[sanitizedKey] = value;
        }
        return sanitizedData;
      });
    }
    return [];
  },
  //
  getTableColumns: (props) => {
    let columns = [];
    let allColumns = props.primaryColumns || {};

    const sortColumn = props.sortedColumn?.column;
    const sortOrder = props.sortedColumn?.asc;
    if (
      props.columnOrder &&
      Array.isArray(props.columnOrder) &&
      props.columnOrder.length > 0
    ) {
      const newColumnsInOrder = {};

      props.columnOrder.forEach((id, index) => {
        if (allColumns[id])
          newColumnsInOrder[id] = { ...allColumns[id], index };
      });
      const remaining = _.without(
        Object.keys(allColumns),
        ...Object.keys(newColumnsInOrder),
      );
      const len = Object.keys(newColumnsInOrder).length;
      if (remaining && remaining.length > 0) {
        remaining.forEach((id, index) => {
          newColumnsInOrder[id] = { ...allColumns[id], index: len + index };
        });
      }
      allColumns = newColumnsInOrder;
    }
    const allColumnProperties = Object.values(allColumns);
    for (let index = 0; index < allColumnProperties.length; index++) {
      const columnProperties = allColumnProperties[index];
      columnProperties.isAscOrder =
        columnProperties.id === sortColumn ? sortOrder : undefined;
      const columnData = columnProperties;
      columns.push(columnData);
    }
    return columns;
  },
  //
  getFilteredTableData: (props) => {
    if (!props.sanitizedTableData || !props.sanitizedTableData.length) {
      return [];
    }
    const derivedTableData = [...props.sanitizedTableData];
    if (props.primaryColumns && _.isPlainObject(props.primaryColumns)) {
      const primaryColumns = props.primaryColumns;
      const columnIds = Object.keys(props.primaryColumns);
      columnIds.forEach((columnId) => {
        const column = primaryColumns[columnId];
        let computedValues = [];

        if (column && column.computedValue) {
          if (_.isString(column.computedValue)) {
            try {
              computedValues = JSON.parse(column.computedValue);
            } catch (e) {
              console.log("Error parsing column value: ", column.computedValue);
            }
          } else if (Array.isArray(column.computedValue)) {
            computedValues = column.computedValue;
          }
        }

        if (computedValues.length === 0) {
          if (props.derivedColumns) {
            const derivedColumn = props.derivedColumns[columnId];
            if (derivedColumn) {
              computedValues = Array(derivedTableData.length).fill("");
            }
          }
        }

        for (let index = 0; index < computedValues.length; index++) {
          derivedTableData[index] = {
            ...derivedTableData[index],
            [columnId]: computedValues[index],
          };
        }
      });
    }

    const columns = props.columns;

    let sortedTableData;
    if (props.sortedColumn) {
      const sortedColumn = props.sortedColumn.column;
      const sortOrder = sortedColumn.asc;
      const column = columns.find((column) => column.id === props.sortedColumn);
      const columnType = column && column.type ? column.type : "text";

      sortedTableData = derivedTableData.sort((a, b) => {
        if (
          _.isPlainObject(a) &&
          _.isPlainObject(b) &&
          !_.isNil(a[sortedColumn]) &&
          !_.isNil(b[sortedColumn])
        ) {
          switch (columnType) {
            case "number":
              return sortOrder
                ? Number(a[sortedColumn]) > Number(b[sortedColumn])
                  ? 1
                  : -1
                : Number(b[sortedColumn]) > Number(a[sortedColumn])
                ? 1
                : -1;
            case "date":
              try {
                return sortOrder
                  ? moment(a[sortedColumn]).isAfter(b[sortedColumn])
                    ? 1
                    : -1
                  : moment(b[sortedColumn]).isAfter(a[sortedColumn])
                  ? 1
                  : -1;
              } catch (e) {
                return -1;
              }
            default:
              return sortOrder
                ? a[sortedColumn].toString().toUpperCase() >
                  b[sortedColumn].toString().toUpperCase()
                  ? 1
                  : -1
                : b[sortedColumn].toString().toUpperCase() >
                  a[sortedColumn].toString().toUpperCase()
                ? 1
                : -1;
          }
        } else {
          return sortOrder ? 1 : 0;
        }
      });
    } else {
      sortedTableData = [...derivedTableData];
    }
    const ConditionFunctions = {
      isExactly: (a, b) => {
        return a.toString() === b.toString();
      },
      empty: (a) => {
        return a === "" || a === undefined || a === null;
      },
      notEmpty: (a) => {
        return a !== "" && a !== undefined && a !== null;
      },
      notEqualTo: (a, b) => {
        return a.toString() !== b.toString();
      },
      isEqualTo: (a, b) => {
        return a.toString() === b.toString();
      },
      lessThan: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA < numericB;
      },
      lessThanEqualTo: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA <= numericB;
      },
      greaterThan: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA > numericB;
      },
      greaterThanEqualTo: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA >= numericB;
      },
      contains: (a, b) => {
        if (isString(a) && isString(b)) {
          return a.includes(b);
        }
        return false;
      },
      doesNotContain: (a, b) => {
        if (_.isString(a) && _.isString(b)) {
          return !a.includes(b);
        }
        return false;
      },
      startsWith: (a, b) => {
        if (_.isString(a) && _.isString(b)) {
          return a.indexOf(b) === 0;
        }
        return false;
      },
      endsWith: (a, b) => {
        if (_.isString(a) && _.isString(b)) {
          return a.length === a.indexOf(b) + b.length;
        }
        return false;
      },
      is: (a, b) => {
        return moment(a).isSame(moment(b), "d");
      },
      isNot: (a, b) => {
        return !moment(a).isSame(moment(b), "d");
      },
      isAfter: (a, b) => {
        return !moment(a).isAfter(moment(b), "d");
      },
      isBefore: (a, b) => {
        return !moment(a).isBefore(moment(b), "d");
      },
    };

    const searchKey = props.searchText ? props.searchText.toLowerCase() : "";

    const finalTableData = sortedTableData.filter((item) => {
      const searchFound = searchKey
        ? Object.values(item)
            .join(", ")
            .toLowerCase()
            .includes(searchKey)
        : true;
      if (!searchFound) return false;
      if (!props.filters || props.filters.length === 0) return true;
      const filterOperator = filters.length >= 2 ? filters[1].operator : "OR";
      let filter = filterOperator === "AND";
      for (let i = 0; i < filters.length; i++) {
        let result = true;
        try {
          const conditionFunction = ConditionFunctions[filters[i].condition];
          if (conditionFunction) {
            result = conditionFunction(
              item[filters[i].column],
              filters[i].value,
            );
          }
        } catch (e) {
          console.log(e);
        }
        const filterValue = result;
        if (filterOperator === "AND") {
          filter = filter && filterValue;
        } else {
          filter = filter || filterValue;
        }
      }
      return filter;
    });
    return finalTableData;
  },
  //
};
