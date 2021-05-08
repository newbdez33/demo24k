import {Suspense} from "react"
import {Base} from "../../parts/base.comp"
import {IDLE} from "../../global/constants"
import {useAddress} from "../../hooks/use-url-address.hook"
import {useCurrentUser} from "../../hooks/use-current-user.hook"
import {useMarketItems} from "../../hooks/use-market-items.hook"
import {useAccountItems} from "../../hooks/use-account-items.hook"
import {useInitialized} from "../../hooks/use-initialized.hook"
import {useKibblesBalance} from "../../hooks/use-kibbles-balance.hook"
import AuthCluster from "../../parts/auth-cluster.comp"
import InitCluster from "../../parts/init-cluster.comp"
import BalanceCluster from "../../parts/balance-cluster.comp"
import MarketItemsCluster from "../../parts/market-items-cluster.comp"
import AccountItemsCluster from "../../parts/account-items-cluster.comp"
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Badge,
  Flex,
  Center,
  Tag,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Button,
  HStack,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Container,
  Form,
  useDisclosure
} from "@chakra-ui/react"
import Cookie from "../../svg/cookie.svg"
import BackPack from "../../svg/backpack.svg"
import {useDropzone} from 'react-dropzone'

export function MarketItemsCount() {
  let l = 0
  return l > 0 ? <Tag ml="1">{l}</Tag> : null
}

export function AccountItemsCount({address}) {
  const items = useAccountItems(address)
  if (items.status !== IDLE) return <Spinner size="xs" ml="1" />
  const l = items?.ids?.length ?? 0
  return l > 0 ? <Tag ml="1">{l}</Tag> : null
}

export function StoreItemsCount() {
  const items = useMarketItems()
  if (items.status !== IDLE) return <Spinner size="xs" ml="1" />
  const l = items?.ids?.length ?? 0
  return l > 0 ? <Tag ml="1">{l}</Tag> : null
}

export function MintButton({address, i}) {
  const items = useAccountItems(address)
  return (
    <>
    <Button disabled={items.status !== IDLE} onClick={() => {items.mint(i)}}>
      Mint Type {i}
    </Button>
    </>
  )
}

function Accept(props) {
  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps
  } = useDropzone({
    accept: 'image/png'
  });

  const acceptedFileItems = acceptedFiles.map(file => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ));

  const url = process.env.REACT_APP_API_FILE_UPLOAD;
  return (
    <form action={url} method="post" encType="multipart/form-data">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} name="file" />
        <p>Drag 'n' drop some files here, or click to select files</p>
        <em>(Only *.jpeg and *.png images will be accepted)</em>
      </div>
      <aside>
        <h4>Ready to upload file:</h4>
        <ul>{acceptedFileItems}</ul>
      </aside>
      <Button type="submit">Upload</Button>
    </form>
  );
}

export function UploadButton({address}) {
  const items = useAccountItems(address)
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Button onClick={onOpen} disabled={items.status !== IDLE} style={{marginTop:"20px"}}>New NFT Upload</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Media file</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Accept />
          </ModalBody>
          {/* <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost">Make NFT</Button>
          </ModalFooter> */}
        </ModalContent>
      </Modal>
    </>
  )
  // return (
  //   <>
  //   <Button disabled={items.status !== IDLE} onClick={() => { openUploadDialog() }}  style={{marginTop:"20px"}}>
  //     Upload new NFT
  //   </Button>
  //   </>
  // )
}

export function InfoBanner({address}) {
  const init = useInitialized(address)
  const kibs = useKibblesBalance(address)
  const [cu] = useCurrentUser()

  const status = {
    notInitialized: {
      type: "info",
      title: "Initialize Your Account",
      text:
        "You need to initialize your account before you can receive Kibble.",
    },
    noKibble: {
      type: "info",
      title: "Get Kibble",
      text: "You need Kibble to buy Items.",
    },
  }

  function Banner(message) {
    return (
      <Flex my="4">
        <Alert status={message.type}>
          <AlertIcon />
          <AlertTitle mr={2}>{message.title}</AlertTitle>
          {message.text}
        </Alert>
      </Flex>
    )
  }

  switch (true) {
    case !init.isInitialized && cu.addr === address:
      return Banner(status.notInitialized)
    case kibs.balance < 0 && cu.addr === address:
      return Banner(status.noKibble)
    default:
      return null
  }
}

export function Page() {
  const address = useAddress()
  const [cu] = useCurrentUser()
  if (address == null) return <div>Not Found</div>

  return (
    <Base>
      <Box p="4">
        <AuthCluster />
        <Flex mb="4">
          <Center>
            <Text mr="4" fontSize="2xl" color="purple.500">
              Account:{" "}
              <Text display="inline" color="black" fontWeight="bold">
                {address}
              </Text>
            </Text>
          </Center>
          {address === cu.addr && (
            <Center>
              <Badge ml="4" variant="outline" colorScheme="orange">
                You
              </Badge>
            </Center>
          )}
        </Flex>
        <Suspense fallback={null}>
          <InfoBanner address={address} />
        </Suspense>
        <Flex>
          <Box>
            <InitCluster address={address} />
          </Box>
          <Box ml="4">
            <BalanceCluster address={address} />
          </Box>
          {cu.addr === address && (
            <Box ml="4">
              <Suspense fallback={null}>
                <MintButton address={address} i={1} />
                &nbsp;
                <MintButton address={address} i={2} />
                &nbsp;
                <MintButton address={address} i={3} />
                &nbsp;
                <MintButton address={address} i={4} />
                &nbsp;
                <MintButton address={address} i={5} />
                &nbsp;
                <MintButton address={address} i={6} />
                &nbsp;
                <MintButton address={address} i={7} />
                &nbsp;
                <MintButton address={address} i={8} />
                <br />
                <UploadButton address={address} />
              </Suspense>
            </Box>
          )}
        </Flex>
        <Tabs colorScheme="pink" defaultIndex={0}>
          <TabList>
            <Tab fontSize="2xl">
              <HStack>
                <Image src={BackPack} />
                <Box>{cu.addr === address ? "My" : "User"} Items</Box>
              </HStack>
              <Suspense fallback={null}>
                <AccountItemsCount address={address} />
              </Suspense>
            </Tab>
            <Tab fontSize="2xl">
              <HStack>
                <Image src={Cookie} />
                <Box>Items Marketplace</Box>
              </HStack>
              <Suspense fallback={null}>
                <MarketItemsCount />
              </Suspense>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <AccountItemsCluster address={address} />
            </TabPanel>
            <TabPanel>
              <MarketItemsCluster />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Base>
  )
}
