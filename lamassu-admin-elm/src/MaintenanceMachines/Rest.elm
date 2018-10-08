module MaintenanceMachines.Rest exposing (..)

import RemoteData exposing (..)
import HttpBuilder exposing (..)
import Json.Decode as D
import Json.Encode as E
import Http
import HttpBuilder exposing (..)
import MaintenanceMachines.Types exposing (..)
import BasicTypes exposing (..)


toModel : SavingStatus -> Machines -> SubModel
toModel status machines =
    { status = status, machines = machines }


getForm : Cmd Msg
getForm =
    get ("/api/machines")
        |> withExpect (Http.expectJson machinesDecoder)
        |> send (Result.map (toModel NotSaving) >> RemoteData.fromResult)
        |> Cmd.map Load


postForm : MachineAction -> Cmd Msg
postForm action =
    post "/api/machines"
        |> withJsonBody (encodeAction action)
        |> withExpect (Http.expectJson machinesDecoder)
        |> send (Result.map (toModel Saved) >> RemoteData.fromResult)
        |> Cmd.map Load


machineDecoder : D.Decoder Machine
machineDecoder =
    D.map7 Machine
        (D.field "deviceId" D.string)
        (D.field "name" D.string)
        (D.field "cashbox" D.int)
        (D.field "cassette1" D.int)
        (D.field "cassette2" D.int)
        (D.field "paired" D.bool)
        (D.field "cashOut" D.bool)


machinesDecoder : D.Decoder Machines
machinesDecoder =
    D.map identity
        (D.field "machines" (D.list machineDecoder))


encodeAction : MachineAction -> E.Value
encodeAction action =
    case action of
        ResetCashOutBills machine ->
            E.object
                [ ( "action", E.string "resetCashOutBills" )
                , ( "deviceId", E.string machine.deviceId )
                , ( "cassettes", E.list [ E.int machine.cassette1, E.int machine.cassette2 ] )
                ]

        UnpairMachine machine ->
            E.object
                [ ( "action", E.string "unpair" )
                , ( "deviceId", E.string machine.deviceId )
                ]

        RebootMachine machine ->
            E.object
                [ ( "action", E.string "reboot" )
                , ( "deviceId", E.string machine.deviceId )
                ]
