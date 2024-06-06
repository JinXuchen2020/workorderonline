import {
  CommandType,
  ICommandService,
  IUniverInstanceService,
  Plugin,
  UniverInstanceType,
  Workbook,
} from "@univerjs/core";
import {
  ComponentManager,
  IMenuService,
  MenuGroup,
  MenuItemType,
  MenuPosition,
  INotificationService
} from "@univerjs/ui";
import { IAccessor, Inject, Injector } from "@wendellhu/redi";
import { SaveSingle } from "@univerjs/icons";
import { IUpdatedCellProps } from "../models";
import { saveUniverExcel } from "../utils/univerApi";

/**
 * Export Excel Button Plugin
 */
class SaveExcelButton extends Plugin {
  static override pluginName = "Save Excel Plugin";
  static override type = UniverInstanceType.UNIVER_SHEET;
  constructor(
    private _config: any,
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
    this.componentManager.register("SaveSingle", SaveSingle);

    const buttonId = "sheet.operation.save-excel-button";

    const menuItem = {
      id: buttonId,
      title: "Save Excel",
      tooltip: "Save Excel",
      icon: "SaveSingle", // icon name
      type: MenuItemType.BUTTON,
      group: MenuGroup.CONTEXT_MENU_DATA,
      positions: [MenuPosition.TOOLBAR_START],
    };
    this.menuService.addMenuItem(menuItem);

    const command = {
      type: CommandType.OPERATION,
      id: buttonId,
      handler: async (accessor: IAccessor) => {
        // inject univer instance service
        const notificationService = accessor.get(INotificationService);
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const updatedCells = this._config.updatedCells as IUpdatedCellProps[];
        const params = this._config.searchParams.toString();
        const bookData = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!.getSnapshot();
        if (updatedCells && updatedCells.length > 0) {
          saveUniverExcel(this._config.userInfo, params, bookData, updatedCells).then(() => {
            notificationService.show({
              type: "success",
              content: `用户：${updatedCells.map(item => item.userName).join(",")}工单保存成功`,
              title: `工单更新`,
            });
          }).catch(() => {
            notificationService.show({
              type: "error",
              content: `用户：${updatedCells.map(item => item.userName).join(",")}工单保存失败`,
              title: `工单更新`,
            });
          }).finally(() => {
            sessionStorage.setItem("isUpdated", "true");
          });
        }
        return true;
      },
    };
    this.commandService.registerCommand(command);
  }
}

export default SaveExcelButton;
