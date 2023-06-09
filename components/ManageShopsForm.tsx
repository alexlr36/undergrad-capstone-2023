import { useUser } from "@supabase/auth-helpers-react"
import { Fragment, Dispatch, SetStateAction, useEffect, useState, useId } from "react"
import { useForm } from "react-hook-form";
import { supabase } from "../utils/supabaseClient";
import {getShopImage, removeShopImage, uploadShopImage } from "../pages/api/cdnHelpers";
import Image from "next/image";

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from "@heroicons/react/24/outline";


type ManageShopsFormProps = {
    shop?: any,
    getShops: Dispatch<SetStateAction<boolean>>,
    userID: string,
    setSubmissionType: Dispatch<SetStateAction<string>>,
    setShowModal: Dispatch<SetStateAction<boolean>>,
    showModal: boolean,
    editFlag?: boolean,
    formProps?: formProps,
}

type formProps = {
    shopID: string | undefined,
    shopName: string,
    shopDescription: string,
    hawkrType: string,
    file: FileList,
    timeOpen: string,
    timeClosed: string,
    // hoursOpen: string,
    // minutesOpen: string, 
    // ampmOpen: string,
    // hoursClosed: string,
    // minutesClosed: string,
    // ampmClosed: string,
    liveTracking: Boolean,
    messagesOn: Boolean,
}

interface IFormValues {
    shopName: string,
    shopDescription: string,
    hawkrType: string,
    file: FileList,
    hoursOpen: string,
    minutesOpen: string, 
    ampmOpen: string,
    hoursClosed: string,
    minutesClosed: string,
    ampmClosed: string,
    liveTracking: Boolean,
    messagesOn: Boolean,
}


export default function ManageShopsForm({getShops, shop, userID, setSubmissionType, showModal, setShowModal, editFlag, formProps}: ManageShopsFormProps){
    type ImageContent = Awaited<ReturnType<typeof getShopImage>>

    const [userLocation, setUserLocation] = useState<any>()

    const user = useUser()
    const [images, setImages] = useState<ImageContent>()
    const SHOP_CDN_URL = 'https://mlijczvqqsvotbjytzjm.supabase.co/storage/v1/object/public/shop-images'
    const base_hawkr_img =  'https://mlijczvqqsvotbjytzjm.supabase.co/storage/v1/object/public/base-hawkr/hawkr_icon.png'

    let editDefaultValues = {}
    console.log('formProps: ' , formProps)
    if (formProps){

        const timeOpen = formProps.timeOpen
        const timeClosed = formProps.timeClosed

        var dateOpen = new Date(`February 04, 2011 ${timeOpen}`);
        var timeOpenString = dateOpen.toLocaleTimeString()
        console.log(timeOpenString)
          

        const hoursOpen = timeOpenString.split(':')[0]
        const minutesOpen = timeOpenString.split(':')[1]
        const suffixOpen  = timeOpenString.split(' ')[1].toLowerCase()

        var dateClosed = new Date(`February 04, 2011 ${timeClosed}`);
        var timeClosedString = dateClosed.toLocaleTimeString()
        const hoursClosed = timeClosedString.split(':')[0]
        const minutesClosed = timeClosedString.split(':')[1]
        const suffixClosed  = timeClosedString.split(' ')[1].toLowerCase()


        editDefaultValues = {
            shopID: formProps.shopID,
            shopName: formProps.shopName,
            shopDescription: formProps.shopDescription,
            hawkrType: formProps.hawkrType,
            file: formProps.file,
            hoursOpen: hoursOpen,
            minutesOpen: minutesOpen, 
            ampmOpen: suffixOpen,
            hoursClosed: hoursClosed,
            minutesClosed: minutesClosed,
            ampmClosed: suffixClosed,
            liveTracking: formProps.liveTracking,
            messagesOn: formProps.messagesOn,
            
        }   

    }
      
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
      } = useForm<IFormValues>({
        defaultValues: editDefaultValues
      });
    useEffect( () => {
    const getImages = async (shopID:any) => {
            if (userID)
            {
                const i = await getShopImage(userID, shopID, supabase)
                setImages(i)
            }
        }

    if (editFlag && formProps){
        getImages(formProps.shopID).catch(console.error)
    }

    }, [editFlag])

    useEffect( () => {
        const getUserCurrentLocation = () =>{
            navigator.geolocation.getCurrentPosition(position => {
                const userPosition = {lat: position.coords.latitude, lng: position.coords.longitude}
                console.log(userPosition)
                setUserLocation(userPosition)
            });
          }

          getUserCurrentLocation()
    }, [userID])

      const onSubmit = async (formData:any) => {
          
        var img_src
        
        let shopID = formData.shopID
        let vendorID = userID
        let shopName = formData.shopName
        let shopDescription = formData.shopDescription
        let messagesOn = formData.messagesOn
        
        console.log(messagesOn)
        console.log(formData)
        let liveTracking = formData.liveTracking
        let hawkrType = formData.hawkrType
        let timeOpen = `${formData.hoursOpen}:${formData.minutesOpen}${formData.ampmOpen}`
        let timeClosed = `${formData.hoursClosed}:${formData.minutesClosed}${formData.ampmClosed}`

        if (!editFlag){
            const { data, error } = await supabase
            .from('shops')
            .insert([
                { vendorID: vendorID,
                    shopName: shopName ,
                    shopDescription: shopDescription ,
                    open: false ,
                    timeOpen: timeOpen,
                    timeClosed: timeClosed ,
                    messagesOn: messagesOn ,
                    liveTracking: liveTracking ,
                    hawkrType: hawkrType, 
                    shop_image_url: base_hawkr_img
                },
            ])

            const { data:resShop, error:resShopError } = await supabase
            .from('shops')
            .select('shopID')
            .match(
                { vendorID: vendorID,
                    shopName: shopName ,
                    shopDescription: shopDescription ,
                    // open: 'false' ,
                    timeOpen: timeOpen,
                    timeClosed: timeClosed ,
                    messagesOn: messagesOn ,
                    liveTracking: liveTracking ,
                    hawkrType: hawkrType, 
                    shop_image_url: base_hawkr_img
                },
            )
            const shopID = resShop ? resShop[0].shopID : ''
        
            if (formData.file['length'] > 0){

                const file = formData.file[0]

                console.log(file)

                //remove  existing image and upload new one
                console.log(user?.id, shopID)
                await uploadShopImage(file, supabase, userID, shopID)
        
                console.log('USE STATE CONTENT OF IMAGES: ', images)

                img_src =`${SHOP_CDN_URL}/${userID}/${shopID}/${file.name}`

                const { data:data2, error:error2 } = await supabase
                .from('shops')
                .update({ shop_image_url: img_src })
                .match(
                    { vendorID: vendorID,
                        shopName: shopName ,
                        shopDescription: shopDescription ,
                        // open: 'false' ,
                        timeOpen: timeOpen,
                        timeClosed: timeClosed ,
                        messagesOn: messagesOn ,
                        liveTracking: liveTracking ,
                        hawkrType: hawkrType, 
                        // shop_image_url: 'NULL',
                    },
                )

            }

            getShops(true)
            console.log('VALUE OF IMG SRC: ', img_src)

        
            const { data:data3, error:error3 } = await supabase
            .from('locations')
            .insert([
            { UUID: vendorID, location: userLocation },
            ])

            if  (!error){
                setSubmissionType('CREATE')

                console.log('should have toasted' )
            }else{
                if (error){
                    alert('Error in creating shop')
                }else{
                    alert('Error in uploading locations')
                }
            }
        }

        //Edit flag set
        else{
            var img_src;

            //update with new image
            if (formData.file['length'] > 0){

                const {data:resShopImage, error:resShopImageError } = await getShopImage(userID, shopID, supabase)

                if(resShopImage){
                    const shopImage = resShopImage[0]
                    
                    if( resShopImage["length"] > 0){
                        await removeShopImage(shopImage.name, supabase, userID, shopID)
                    }
                }
                    
                await uploadShopImage(formData.file[0], supabase, userID, shopID)

                img_src =`${SHOP_CDN_URL}/${userID}/${shopID}/${formData.file[0].name}`
                
                console.log('EDIT flag img src: ', img_src)
                
                const {data, error} = await supabase
                .from('shops')
                .update({
                    shopName: shopName,
                    shopDescription: shopDescription,
                    open: formData.open,
                    timeOpen: timeOpen,
                    timeClosed: timeClosed,
                    messagesOn: messagesOn,
                    liveTracking: liveTracking,
                    hawkrType: hawkrType,
                    shop_image_url: img_src
                })
                .match({
                    shopID: shopID
                })

                getShops(true)


            }else{

                //Update with already existing image
                var img_src
                const {data:resShopImage, error:resShopImageError } = await getShopImage(userID, shopID, supabase)
                
                if(resShopImage){
                const shopImage = resShopImage[0]
                
                    if(resShopImage["length"] > 0){
                        img_src =`${SHOP_CDN_URL}/${userID}/${shopID}/${shopImage.name}`
                    }else{
                        img_src = base_hawkr_img
                    }
                }
                

                const {data, error} = await supabase
                .from('shops')
                .update({
                    shopName: shopName,
                    shopDescription: shopDescription,
                    open: formData.open,
                    timeOpen: timeOpen,
                    timeClosed: timeClosed,
                    messagesOn: messagesOn,
                    liveTracking: liveTracking,
                    hawkrType: hawkrType,
                    shop_image_url: img_src
                })
                .match({
                    shopID: shopID
                })

                getShops(true)

            }
            setSubmissionType('EDIT')            
        }
        setShowModal(false)
        // reset()

        };

return(

<>

    <Transition.Root show={showModal} as={Fragment}>
    <Dialog as="div" className="relative z-10 " onClose={setShowModal}>
        <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => setShowModal(false)}
                >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
                </div>
                <div className="sm:flex sm:items-start">
                {/* <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div> */}


                {/* Section of Title and Content */}
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                    Create Shop
                    </Dialog.Title>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">
                        This information will be displayed publicly so be careful what you share.
                        </p>
                    </div>
                    <form 
                    onSubmit={handleSubmit(onSubmit)}
                    method="POST"
                    className="space-y-8 divide-y divide-gray-200"
                    >
                    <div className="space-y-8 divide-y divide-gray-200">
                        <div>
                            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="shopName" className="block text-sm font-medium leading-6 text-gray-900">
                                        Shop Name
                                    </label>
                                    <div className="mt-2">
                                        <input
                                        type="text"
                                        id="shopName"
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        {...register("shopName", {required: true})}
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-4">
                                    <label htmlFor="shopDescription" className="block text-sm font-medium leading-6 text-gray-900">
                                        About
                                    </label>
                                    <div className="mt-2">
                                        <textarea
                                        id="shopDescription"
                                        rows={3}
                                        className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
                                        defaultValue={''}
                                        {...register("shopDescription", {required: true})}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">Write a few sentences about yourself.</p>
                                </div>
                                
                            <div className="sm:col-span-5">
                                <label htmlFor="hawkrType" className="block text-sm font-medium leading-6 text-gray-900">
                                    Hawkr Type
                                </label>
                                <div className="mt-2">
                                    <select
                                    id="hawkrType"
                                    autoComplete="hawkrType"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    {...register("hawkrType", {required: true})}
                                    >
                                    <option>FoodTruck</option>
                                    <option>Art</option>
                                    <option>Clothes</option>
                                    </select>
                                </div>
                            </div>

                        </div>

                            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-6">
                                    <label htmlFor="photo" className="block text-sm font-medium leading-6 text-gray-900">
                                        Current Shop Photo
                                    </label>
                                    <div className="mt-2 flex items-center">
                                    {images?.data?.map( (image:any) => {
                                        return(
                                            <>
                                            <Image key={image.id} height={100} width={100} alt={shop.shopName} src={SHOP_CDN_URL + '/' + userID + '/' + shop.shopID + '/'+ image.name}/>
                                            </>
                                            );
                                    })}
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="file" className="block text-sm font-medium leading-6 text-gray-900">
                                        Shop Photo
                                    </label>
                                    
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">Upload file</label>
                                    <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50" 
                                        aria-describedby="file_input_help" 
                                        type="file"
                                        {...register("file", {required: false})}
                                        />
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">SVG, PNG, JPG or GIF (MAX. 800x400px).</p>

                                </div>
                            </div>
                        </div>

                        {/* Time Open */}
                        <div className="pt-8">
                            <div>
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Time Open</h3>
                                <p className="mt-1 text-sm text-gray-500">Typical time open during days open</p>
                            </div>
                        </div>

                        <div className="mt-2 p-3 w-7/12 bg-white rounded-lg shadow-xl text-black">
                            <div className="flex-col">
                                <select className="border-transparent bg-transparent text-l appearance-none outline-non"
                                    {...register("hoursOpen", {required: true})}>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>
                                <option value="11">11</option>
                                <option value="12">12</option>
                                </select>
                                <span className="text-l mr-2">:</span>
                                <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                                    {...register("minutesOpen", {required: true})}>
                                <option value="00">00</option>
                                <option value="05">05</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                                <option value="25">25</option>
                                <option value="30">30</option>
                                <option value="35">35</option>
                                <option value="40">40</option>
                                <option value="45">45</option>
                                <option value="50">50</option>
                                <option value="55">55</option>
                                </select>
                                <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                                    {...register("ampmOpen", {required: true})}>
                                <option value="am">AM</option>
                                <option value="pm">PM</option>
                                </select>
                            </div>
                        </div>

                        {/* Time Closed */}
                        <div className="pt-8">
                            <div>
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Time Closed</h3>
                                <p className="mt-1 text-sm text-gray-500">Time open up to this time</p>
                            </div>
                        </div>

                        <div className="mt-2 p-3 w-7/12 bg-white rounded-lg shadow-xl text-black">
                            <div className="flex-col">
                                <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                                    {...register("hoursClosed", {required: true})}>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>
                                <option value="11">11</option>
                                <option value="12">12</option>
                                </select>
                                <span className="text-l mr-2">:</span>
                                <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                                    {...register("minutesClosed", {required: true})}>
                                <option value="00">00</option>
                                <option value="05">05</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                                <option value="25">25</option>
                                <option value="30">30</option>
                                <option value="35">35</option>
                                <option value="40">40</option>
                                <option value="45">45</option>
                                <option value="50">50</option>
                                <option value="55">55</option>
                                </select>
                                <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                                    {...register("ampmClosed", {required: true})}>
                                <option value="am">AM</option>
                                <option value="pm">PM</option>
                                </select>
                            </div>
                        </div>


                        <div className="pt-8">
                        <div>
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Shop Settings</h3>
                            <p className="mt-1 text-sm text-gray-500">
                            Personalized settings on how to run your Shop. Manually or automatically
                            </p>
                        </div>
                        <div className="mt-6">
                            <fieldset>
                            <legend className="sr-only">Live Tracking</legend>
                            <div className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                Tracking
                            </div>
                            <div className="mt-4 space-y-4">
                                <div className="relative flex items-start">
                                    <div className="flex h-6 items-center">
                                        <input
                                        id="liveTracking"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        {...register("liveTracking", {required: false})}
                                        />
                                    </div>
                                    <div className="ml-3">
                                        <label htmlFor="liveTracking" className="text-sm font-medium leading-6 text-gray-900">
                                        Live Tracking
                                        </label>
                                        <p className="text-sm text-gray-500">Automatically track your location. No need for manual entry</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start">
                                    <div className="flex h-6 items-center">
                                        <input
                                        id="messagesOn"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        {...register("messagesOn", {required: false})}
                                        />
                                    </div>
                                    <div className="ml-3">
                                        <label htmlFor="messagesOn" className="text-sm font-medium leading-6 text-gray-900">
                                        Messages
                                        </label>
                                        <p className="text-sm text-gray-500">Ability to accept messages from client</p>
                                    </div>
                                </div>

                            </div>
                            </fieldset>
                        </div>
                        </div>
                    </div>
                {/* ---------- BUTTONS SECTION --------- */}
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse pt-4">
                <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 sm:ml-3 sm:w-auto"                >
                    Submit
                </button>
                <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setShowModal(false)}
                >
                    Cancel
                </button>
                </div>
                </form>
                </div>

   
            {/* Dark color for button:  dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700 */}

        </div>






            </Dialog.Panel>
            </Transition.Child>
        </div>
        </div>
    </Dialog>
</Transition.Root>

    </>

)


}