module MaintenanceMachines.Types exposing (..)

import RemoteData exposing (..)
import BasicTypes exposing (..)


type alias SubModel =
    { status : SavingStatus
    , machines : Machines
    }


type alias Model =
    RemoteData.WebData SubModel


type alias Machine =
    { deviceId : String
    , name : String
    , cashbox : Int
    , cassette1 : Int
    , cassette2 : Int
    , paired : Bool
    , cashOut : Bool
    }


type alias Machines =
    List Machine


type MachineAction
    = ResetCashOutBills Machine
    | UnpairMachine Machine
    | RebootMachine Machine


type Msg
    = Action
    | Load Model
    | InputCassette Machine Position String
    | Submit MachineAction
    | HideSaveIndication


type Position
    = Top
    | Bottom
