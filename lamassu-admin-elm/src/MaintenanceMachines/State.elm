module MaintenanceMachines.State exposing (..)

import RemoteData exposing (..)
import String
import List
import Process
import Task
import Time exposing (second)
import MaintenanceMachines.Types exposing (..)
import MaintenanceMachines.Rest exposing (..)
import BasicTypes exposing (..)


init : Model
init =
    NotAsked


load : ( Model, Cmd Msg )
load =
    ( Loading, getForm )


updateMachine : Machine -> Machine -> Machine
updateMachine machine oldMachine =
    if machine.deviceId == oldMachine.deviceId then
        machine
    else
        oldMachine


updateCassette : Machine -> Position -> String -> SubModel -> ( SubModel, Cmd Msg )
updateCassette machine position str subModel =
    let
        countResult =
            String.toInt str

        updatedMachine =
            case countResult of
                Ok count ->
                    case position of
                        Top ->
                            { machine | cassette1 = count }

                        Bottom ->
                            { machine | cassette2 = count }

                Err _ ->
                    machine

        machines =
            List.map (updateMachine updatedMachine) subModel.machines
    in
        { subModel | machines = machines } ! []


updateAction : MachineAction -> SubModel -> ( SubModel, Cmd Msg )
updateAction action subModel =
    subModel ! [ postForm action ]


saveUpdate : SubModel -> ( SubModel, Cmd Msg )
saveUpdate model =
    let
        cmd =
            if (model.status == Saved) then
                Process.sleep (2 * second)
                    |> Task.perform (\_ -> HideSaveIndication)
            else
                Cmd.none
    in
        model ! [ cmd ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Action ->
            model ! []

        Load newModel ->
            RemoteData.update saveUpdate newModel

        InputCassette machine position str ->
            RemoteData.update (updateCassette machine position str) model

        Submit action ->
            RemoteData.update (updateAction action) model

        HideSaveIndication ->
            RemoteData.update (\subModel -> { subModel | status = NotSaving } ! []) model
