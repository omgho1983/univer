import { Disposable, ICommandService, IStyleData, LifecycleStages, OnLifecycle } from '@univerjs/core';
import { IDisposable } from '@wendellhu/redi';

import {
    AddWorksheetMergeAllCommand,
    AddWorksheetMergeCommand,
    AddWorksheetMergeHorizontalCommand,
    AddWorksheetMergeVerticalCommand,
} from '../commands/commands/add-worksheet-merge.command';
import { ClearSelectionAllCommand } from '../commands/commands/clear-selection-all.command';
import { ClearSelectionContentCommand } from '../commands/commands/clear-selection-content.command';
import { ClearSelectionFormatCommand } from '../commands/commands/clear-selection-format.command';
import { CopySheetCommand } from '../commands/commands/copy-worksheet.command';
import { DeleteRangeMoveLeftCommand } from '../commands/commands/delete-range-move-left.command';
import { DeleteRangeMoveUpCommand } from '../commands/commands/delete-range-move-up.command';
import { InsertRangeMoveDownCommand } from '../commands/commands/insert-range-move-down.command';
import { InsertRangeMoveRightCommand } from '../commands/commands/insert-range-move-right.command';
import {
    InsertColAfterCommand,
    InsertColBeforeCommand,
    InsertColCommand,
    InsertRowAfterCommand,
    InsertRowBeforeCommand,
    InsertRowCommand,
} from '../commands/commands/insert-row-col.command';
import { InsertSheetCommand } from '../commands/commands/insert-sheet.command';
import { MoveRangeCommand } from '../commands/commands/move-range.command';
import { MoveColsCommand, MoveRowsCommand } from '../commands/commands/move-rows-cols.command';
import { RemoveColCommand, RemoveRowCommand } from '../commands/commands/remove-row-col.command';
import { RemoveSheetCommand } from '../commands/commands/remove-sheet.command';
import { RemoveWorksheetMergeCommand } from '../commands/commands/remove-worksheet-merge.command';
import {
    SetBorderColorCommand,
    SetBorderCommand,
    SetBorderPositionCommand,
    SetBorderStyleCommand,
} from '../commands/commands/set-border-command';
import {
    SetColHiddenCommand,
    SetSelectedColsVisibleCommand,
    SetSpecificColsVisibleCommand,
} from '../commands/commands/set-col-visible.command';
import { SetFrozenCommand } from '../commands/commands/set-frozen.command';
import { SetFrozenCancelCommand } from '../commands/commands/set-frozen-cancel.command';
import { SetRangeFormattedValueCommand } from '../commands/commands/set-range-formatted-value.command';
import { SetRangeValuesCommand } from '../commands/commands/set-range-values.command';
import {
    SetRowHiddenCommand,
    SetSelectedRowsVisibleCommand,
    SetSpecificRowsVisibleCommand,
} from '../commands/commands/set-row-visible.command';
import {
    ResetBackgroundColorCommand,
    ResetTextColorCommand,
    SetBackgroundColorCommand,
    SetHorizontalTextAlignCommand,
    SetStyleCommand,
    SetTextColorCommand,
    SetTextRotationCommand,
    SetTextWrapCommand,
    SetVerticalTextAlignCommand,
} from '../commands/commands/set-style.command';
import { SetTabColorCommand } from '../commands/commands/set-tab-color.command';
import { SetWorksheetActivateCommand } from '../commands/commands/set-worksheet-activate.command';
import { DeltaColumnWidthCommand, SetColWidthCommand } from '../commands/commands/set-worksheet-col-width.command';
import { SetWorksheetHideCommand } from '../commands/commands/set-worksheet-hide.command';
import { SetWorksheetNameCommand } from '../commands/commands/set-worksheet-name.command';
import { SetWorksheetOrderCommand } from '../commands/commands/set-worksheet-order.command';
import {
    DeltaRowHeightCommand,
    SetRowHeightCommand,
    SetWorksheetRowIsAutoHeightCommand,
} from '../commands/commands/set-worksheet-row-height.command';
import { SetWorksheetShowCommand } from '../commands/commands/set-worksheet-show.command';
import { TrimWhitespaceCommand } from '../commands/commands/trim-whitespace.command';
import { AddWorksheetMergeMutation } from '../commands/mutations/add-worksheet-merge.mutation';
import { DeleteRangeMutation } from '../commands/mutations/delete-range.mutation';
import { InsertRangeMutation } from '../commands/mutations/insert-range.mutation';
import { InsertColMutation, InsertRowMutation } from '../commands/mutations/insert-row-col.mutation';
import { InsertSheetMutation } from '../commands/mutations/insert-sheet.mutation';
import { MoveRangeMutation } from '../commands/mutations/move-range.mutation';
import { MoveColsMutation, MoveRowsMutation } from '../commands/mutations/move-rows-cols.mutation';
import { RemoveColMutation, RemoveRowMutation } from '../commands/mutations/remove-row-col.mutation';
import { RemoveSheetMutation } from '../commands/mutations/remove-sheet.mutation';
import { RemoveWorksheetMergeMutation } from '../commands/mutations/remove-worksheet-merge.mutation';
import { SetColHiddenMutation, SetColVisibleMutation } from '../commands/mutations/set-col-visible.mutation';
import { SetFrozenMutation } from '../commands/mutations/set-frozen.mutation';
import { SetRangeFormattedValueMutation } from '../commands/mutations/set-range-formatted-value.mutation';
import { SetRangeValuesMutation } from '../commands/mutations/set-range-values.mutation';
import { SetRowHiddenMutation, SetRowVisibleMutation } from '../commands/mutations/set-row-visible.mutation';
import { SetTabColorMutation } from '../commands/mutations/set-tab-color.mutation';
import { SetWorksheetActivateMutation } from '../commands/mutations/set-worksheet-activate.mutation';
import { SetWorksheetColWidthMutation } from '../commands/mutations/set-worksheet-col-width.mutation';
import { SetWorksheetHideMutation } from '../commands/mutations/set-worksheet-hide.mutation';
import { SetWorksheetNameMutation } from '../commands/mutations/set-worksheet-name.mutation';
import { SetWorksheetOrderMutation } from '../commands/mutations/set-worksheet-order.mutation';
import {
    SetWorksheetRowAutoHeightMutation,
    SetWorksheetRowHeightMutation,
    SetWorksheetRowIsAutoHeightMutation,
} from '../commands/mutations/set-worksheet-row-height.mutation';

export interface IStyleTypeValue<T> {
    type: keyof IStyleData;
    value: T | T[][];
}

/**
 * The controller to provide the most basic sheet CRUD methods to other modules of sheet modules.
 */
@OnLifecycle(LifecycleStages.Rendered, BasicWorksheetController)
export class BasicWorksheetController extends Disposable implements IDisposable {
    constructor(@ICommandService private readonly _commandService: ICommandService) {
        super();

        [
            AddWorksheetMergeAllCommand,
            AddWorksheetMergeCommand,
            AddWorksheetMergeHorizontalCommand,
            AddWorksheetMergeMutation,
            AddWorksheetMergeVerticalCommand,
            ClearSelectionAllCommand,
            ClearSelectionContentCommand,
            ClearSelectionFormatCommand,
            CopySheetCommand,
            DeleteRangeMoveLeftCommand,
            DeleteRangeMoveUpCommand,
            DeleteRangeMutation,
            DeltaColumnWidthCommand,
            DeltaRowHeightCommand,
            InsertColAfterCommand,
            InsertColBeforeCommand,
            InsertColCommand,
            InsertColMutation,
            InsertRangeMoveDownCommand,
            InsertRangeMoveRightCommand,
            InsertRangeMutation,
            InsertRowAfterCommand,
            InsertRowBeforeCommand,
            InsertRowCommand,
            InsertRowMutation,
            InsertSheetCommand,
            InsertSheetMutation,
            MoveColsCommand,
            MoveColsMutation,
            MoveRangeCommand,
            MoveRangeMutation,
            MoveRowsCommand,
            MoveRowsMutation,
            RemoveColCommand,
            RemoveColMutation,
            RemoveRowCommand,
            RemoveRowMutation,
            RemoveSheetCommand,
            RemoveSheetMutation,
            RemoveWorksheetMergeCommand,
            RemoveWorksheetMergeMutation,
            ResetBackgroundColorCommand,
            ResetTextColorCommand,
            SetBackgroundColorCommand,
            SetBorderColorCommand,
            SetBorderCommand,
            SetBorderPositionCommand,
            SetBorderStyleCommand,
            SetColHiddenCommand,
            SetColHiddenMutation,
            SetColVisibleMutation,
            SetColWidthCommand,
            SetFrozenCancelCommand,
            SetFrozenCommand,
            SetFrozenMutation,
            SetHorizontalTextAlignCommand,
            SetRangeFormattedValueCommand,
            SetRangeFormattedValueMutation,
            SetRangeValuesCommand,
            SetRangeValuesMutation,
            SetRowHeightCommand,
            SetRowHiddenCommand,
            SetRowHiddenMutation,
            SetRowVisibleMutation,
            SetSelectedColsVisibleCommand,
            SetSelectedRowsVisibleCommand,
            SetSpecificColsVisibleCommand,
            SetSpecificRowsVisibleCommand,
            SetStyleCommand,
            SetTabColorCommand,
            SetTabColorMutation,
            SetTextColorCommand,
            SetTextRotationCommand,
            SetTextWrapCommand,
            SetVerticalTextAlignCommand,
            SetWorksheetActivateCommand,
            SetWorksheetActivateMutation,
            SetWorksheetColWidthMutation,
            SetWorksheetHideCommand,
            SetWorksheetHideMutation,
            SetWorksheetNameCommand,
            SetWorksheetNameMutation,
            SetWorksheetOrderCommand,
            SetWorksheetOrderMutation,
            SetWorksheetRowAutoHeightMutation,
            SetWorksheetRowHeightMutation,
            SetWorksheetRowIsAutoHeightCommand,
            SetWorksheetRowIsAutoHeightMutation,
            SetWorksheetShowCommand,
            TrimWhitespaceCommand,
        ].forEach((command) => this.disposeWithMe(this._commandService.registerCommand(command)));
    }
}
