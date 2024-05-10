import {
  BooleanNumber,
  CommandType,
  ICellData,
  ICommandService,
  IUniverInstanceService,
  IWorksheetData,
  Plugin,
  UniverInstanceType,
  Workbook,
} from "@univerjs/core";
import {
  IInsertSheetCommandParams,
  IRemoveSheetCommandParams,
  InsertSheetCommand,
  RemoveSheetCommand,
} from "@univerjs/sheets";
import {
  ComponentManager,
  IMenuService,
  MenuGroup,
  MenuItemType,
  MenuPosition,
} from "@univerjs/ui";
import { IAccessor, Inject, Injector } from "@wendellhu/redi";
import { FolderSingle } from "@univerjs/icons";
import * as XLSX from "xlsx";
/**
 * wait user select csv file
 */
const waitUserSelectCSVFile = (
  onSelect: (data: { sheetName: string; data: IWorksheetData }) => void
) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xls,.xlsx,.csv";
  input.click();

  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      const workbook = XLSX.read(data, { type: "array" });

      workbook.SheetNames.forEach((sheetName) => {
        //const sheetId = (workbook.Workbook?.Sheets![0] as any).id;
        const text = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        const rows = text.split(/\r\n|\n/);
        const data = rows.map((line) => line.split(","));

        const colsCount = data.reduce(
          (max, row) => Math.max(max, row.length),
          0
        );

        const sheetData: IWorksheetData = {
          id: sheetName,
          name: sheetName,
          tabColor: "",
          hidden: BooleanNumber.FALSE,
          rowCount: data.length,
          columnCount: colsCount,
          zoomRatio: 1,
          scrollTop: 0,
          scrollLeft: 0,
          defaultColumnWidth: 93,
          defaultRowHeight: 27,
          cellData: parseCSV2UniverData(data),
          rowHeader: {
            width: 46,
            hidden: BooleanNumber.FALSE,
          },
          columnHeader: {
            height: 20,
            hidden: BooleanNumber.FALSE,
          },
          showGridlines: BooleanNumber.TRUE,
          selections: [],
          rightToLeft: BooleanNumber.FALSE,
          mergeData: [],
          rowData: {},
          columnData: {},
          freeze: {
            xSplit: 0,
            ySplit: 0,
            startRow: -1,
            startColumn: -1,
          },
        };

        onSelect({
          sheetName,
          data: sheetData,
        });
      });
    };
    reader.readAsArrayBuffer(file);
  };
};

/**
 * parse csv to univer data
 * @param csv
 * @returns { v: string }[][]
 */
const parseCSV2UniverData = (csv: string[][]): ICellData[][] => {
  return csv.map((row) => {
    return row.map((cell) => {
      return {
        v: cell || "",
      };
    });
  });
};

/**
 * Import Excel Button Plugin
 */
class ImportExcelPlugin extends Plugin {
  static override pluginName = "Import Excel Plugin";
  static override type = UniverInstanceType.UNIVER_SHEET;

  constructor(
    // inject injector, required
    @Inject(Injector) override readonly _injector: Injector,
    // inject menu service, to add toolbar button
    @Inject(IMenuService) private menuService: IMenuService,
    // inject command service, to register command handler
    @Inject(ICommandService) private readonly commandService: ICommandService,
    // inject component manager, to register icon component
    @Inject(ComponentManager)
    private readonly componentManager: ComponentManager
  ) {
    // plugin id
    super();
  }

  /**
   * The first lifecycle of the plugin mounted on the Univer instance,
   * the Univer business instance has not been created at this time.
   * The plugin should add its own module to the dependency injection system at this lifecycle.
   * It is not recommended to initialize the internal module of the plugin outside this lifecycle.
   */
  onStarting() {
    // register icon component
    this.componentManager.register("FolderSingle", FolderSingle);

    const buttonId = "import-excel-button";

    const menuItem = {
      id: buttonId,
      title: "Import Excel",
      tooltip: "Import Excel",
      icon: "FolderSingle", // icon name
      type: MenuItemType.BUTTON,
      group: MenuGroup.CONTEXT_MENU_DATA,
      positions: [MenuPosition.TOOLBAR_START],
    };
    this.menuService.addMenuItem(menuItem);

    const command = {
      type: CommandType.OPERATION,
      id: buttonId,
      handler: (accessor: IAccessor) => {
        // inject univer instance service
        const univer = accessor.get(IUniverInstanceService);
        const commandService = accessor.get(ICommandService);
        // get current sheet
        const workbook = univer.getCurrentUnitForType<Workbook>(
          UniverInstanceType.UNIVER_SHEET
        )!;

        // wait user select csv file
        waitUserSelectCSVFile(({ sheetName, data }) => {
          if (workbook.checkSheetName(sheetName)) {
            const sheet = workbook.getSheetBySheetName(sheetName)!;
            commandService.executeCommand<IRemoveSheetCommandParams>(
              RemoveSheetCommand.id,
              {
                unitId: workbook.getUnitId(),
                subUnitId: sheet.getSheetId(),
              }
            );
          }

          commandService.executeCommand<IInsertSheetCommandParams>(
            InsertSheetCommand.id,
            {
              unitId: workbook.getUnitId(),
              sheet: data,
              index: workbook.getSheetSize(),
            }
          );
        });
        return true;
      },
    };
    this.commandService.registerCommand(command);
  }
}

export default ImportExcelPlugin;
