module Css.Admin exposing (className, class, classList, id)

import Css.Helpers
import Html
import Html.CssHelpers


name : String
name =
    "lamassuAdmin"


helpers : Html.CssHelpers.Namespace String class id msg
helpers =
    Html.CssHelpers.withNamespace name


className : class -> String
className class =
    Css.Helpers.identifierToString name class


class : List class -> Html.Attribute msg
class =
    helpers.class


classList : List ( class, Bool ) -> Html.Attribute msg
classList =
    helpers.classList


id : id -> Html.Attribute msg
id =
    helpers.id
