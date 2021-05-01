/* typehints:start */
import { GameRoot } from "../root";
/* typehints:end */

import { enumGameModeIds } from "../game_mode";
import { PuzzleGameMode } from "./puzzle";
import { MetaStorageBuilding } from "../buildings/storage";
import { MetaReaderBuilding } from "../buildings/reader";
import { MetaFilterBuilding } from "../buildings/filter";
import { MetaDisplayBuilding } from "../buildings/display";
import { MetaLeverBuilding } from "../buildings/lever";
import { MetaItemProducerBuilding } from "../buildings/item_producer";
import { MetaMinerBuilding } from "../buildings/miner";
import { MetaWireBuilding } from "../buildings/wire";
import { MetaWireTunnelBuilding } from "../buildings/wire_tunnel";
import { MetaConstantSignalBuilding } from "../buildings/constant_signal";
import { MetaLogicGateBuilding } from "../buildings/logic_gate";
import { MetaVirtualProcessorBuilding } from "../buildings/virtual_processor";
import { MetaAnalyzerBuilding } from "../buildings/analyzer";
import { MetaComparatorBuilding } from "../buildings/comparator";
import { MetaTransistorBuilding } from "../buildings/transistor";
import { MetaConstantProducerBuilding } from "../buildings/constant_producer";
import { MetaGoalAcceptorBuilding } from "../buildings/goal_acceptor";
import { HUDConstantSignalEdit } from "../hud/parts/constant_signal_edit";
import { PuzzleSerializer } from "../../savegame/puzzle_serializer";
import { T } from "../../translations";
import { HUDPuzzlePlayMetadata } from "../hud/parts/puzzle_play_metadata";
import { createLogger } from "../../core/logging";
import { HUDPuzzleCompleteNotification } from "../hud/parts/puzzle_complete_notification";

const logger = createLogger("puzzle-play");

export class PuzzlePlayGameMode extends PuzzleGameMode {
    static getId() {
        return enumGameModeIds.puzzlePlay;
    }

    /**
     * @param {GameRoot} root
     * @param {object} payload
     * @param {import("../../savegame/savegame_typedefs").PuzzleFullData} payload.puzzle
     */
    constructor(root, { puzzle }) {
        super(root);

        this.hiddenBuildings = [
            MetaConstantProducerBuilding,
            MetaGoalAcceptorBuilding,

            MetaStorageBuilding,
            MetaReaderBuilding,
            MetaFilterBuilding,
            MetaDisplayBuilding,
            MetaLeverBuilding,
            MetaItemProducerBuilding,
            MetaMinerBuilding,

            MetaWireBuilding,
            MetaWireTunnelBuilding,
            MetaConstantSignalBuilding,
            MetaLogicGateBuilding,
            MetaVirtualProcessorBuilding,
            MetaAnalyzerBuilding,
            MetaComparatorBuilding,
            MetaTransistorBuilding,
        ];

        this.additionalHudParts.puzzlePlayMetadata = HUDPuzzlePlayMetadata;
        this.additionalHudParts.puzzleCompleteNotification = HUDPuzzleCompleteNotification;

        root.signals.postLoadHook.add(this.loadPuzzle, this);

        this.puzzle = puzzle;
    }

    loadPuzzle() {
        let errorText;
        logger.log("Loading puzzle", this.puzzle);

        try {
            this.zoneWidth = this.puzzle.game.bounds.w;
            this.zoneHeight = this.puzzle.game.bounds.h;
            errorText = new PuzzleSerializer().deserializePuzzle(this.root, this.puzzle.game);
        } catch (ex) {
            errorText = ex.message || ex;
        }

        if (errorText) {
            this.root.gameState.moveToState("PuzzleMenuState", {
                error: {
                    title: T.dialogs.puzzleLoadError.title,
                    desc: T.dialogs.puzzleLoadError.desc + " " + errorText,
                },
            });
            // const signals = this.root.hud.parts.dialogs.showWarning(
            //     T.dialogs.puzzleLoadError.title,
            //     T.dialogs.puzzleLoadError.desc + " " + errorText
            // );
            // signals.ok.add(() => this.root.gameState.moveToState("PuzzleMenuState"));
        }
    }

    /**
     *
     * @param {boolean} liked
     * @param {number} difficulty
     * @param {number} time
     */
    trackCompleted(liked, difficulty, time) {
        const closeLoading = this.root.hud.parts.dialogs.showLoadingDialog();

        return this.root.app.clientApi
            .apiCompletePuzzle(this.puzzle.meta.id, {
                time,
                difficulty,
                liked,
            })
            .catch(err => {
                logger.warn("Failed to complete puzzle:", err);
            })
            .then(() => {
                closeLoading();
            });
    }
}
