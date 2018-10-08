module SelectizeHelper exposing (LocalConfig, buildConfig)

import Selectize exposing (..)
import Css.Selectize
import Css.Classes exposing (CssClasses)


type alias LocalConfig msg idType itemType =
    { toMsg : State -> msg
    , onAdd : idType -> State -> msg
    , onRemove : State -> msg
    , onFocus : State -> msg
    , onBlur : State -> msg
    , toId : itemType -> idType
    , enabled : Bool
    }


type alias SpecificConfig itemType =
    { selectedDisplay : itemType -> String
    , optionDisplay : itemType -> String
    , maxItems : Int
    , match : String -> List itemType -> List itemType
    , customCssClass: CssClasses
    }


buildConfig :
    LocalConfig msg idType itemType
    -> SpecificConfig itemType
    -> Config msg idType itemType
buildConfig localConfig specificConfig =
    { maxItems = specificConfig.maxItems
    , boxLength = 5
    , toMsg = localConfig.toMsg
    , onAdd = localConfig.onAdd
    , onRemove = localConfig.onRemove
    , onFocus = localConfig.onFocus
    , onBlur = localConfig.onBlur
    , toId = localConfig.toId
    , enabled = localConfig.enabled
    , selectedDisplay = specificConfig.selectedDisplay
    , optionDisplay = specificConfig.optionDisplay
    , match = specificConfig.match
    , htmlOptions =
        { instructionsForBlank = "Start typing for options"
        , noMatches = "No matches"
        , atMaxLength = "Type backspace to edit"
        , typeForMore = "Type for more options"
        , noOptions = "No options"
        , notAvailable = "N/A"
        , classes = Css.Selectize.classes
        , customCssClass = specificConfig.customCssClass
        }
    }
