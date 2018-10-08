module FieldSet.State exposing (update)

import FieldSet.Types exposing (..)


updateField : String -> String -> Field -> Field
updateField fieldCode fieldValueString field =
    if .code field == fieldCode then
        { field | value = updateFieldValue fieldValueString field.value }
    else
        field


updateFieldSet : String -> String -> List Field -> List Field
updateFieldSet fieldCode fieldValueString fields =
    List.map (updateField fieldCode fieldValueString) fields


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Input fieldCode valueString ->
            updateFieldSet fieldCode valueString model ! []
