import { Box } from '@material-ui/core'
import React from 'react'

import { Button } from 'src/components/buttons'
import { Label3 } from 'src/components/typography'

const IndividualDiscounts = () => {
  return (
    <Box display="flex" alignItems="left" flexDirection="column">
      <Label3>
        It seems there are no active individual customer discounts on your
        network.
      </Label3>
      <Button>Add individual discount</Button>
    </Box>
  )
}

export default IndividualDiscounts
