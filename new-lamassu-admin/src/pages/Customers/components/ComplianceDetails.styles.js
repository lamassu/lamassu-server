const complianceDetailsStyles = {
  complianceDetailsGrid: {
    display: 'flex',
    flexDirection: 'row'
  },
  firstColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginRight: 10
  },
  lastColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginLeft: 10
  },
  photoWrapper: ({ width }) => ({
    display: 'flex',
    justifyContent: 'center',
    width
  })
}

export { complianceDetailsStyles }
