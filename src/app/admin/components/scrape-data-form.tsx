'use client'
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import extractDataFromUrl from "@/app/admin/actions/extractDataFromUrl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { MultiSelect } from "@/components/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Business } from "@/app/admin/types";
import saveDataInDb from "@/app/admin/actions/saveDataInDb";
import { PencilIcon } from "lucide-react";
import { supabaseFrontent } from "@/lib/supabase/frontend";
import { ScrollArea } from "@/components/ui/scroll-area";


const dummyData: Business[] | (() => Business[]) = []

// const dummyData = [
//   {
//     "name": "Båbler Vinbar",
//     "articleTitle": "Båbler Vinbar: Neonlys og lekne priser",
//     "articleContent": "Vi har tatt en titt på vinkartet og regnbuelysene på Båbler.\nTekst & foto: Nora Sæter\nNeonskiltbutikken Naughty Neon på Alexander Kiellands plass har stengt sjappa og åpnet vinbar i stedet. Vi har testet både boblene og stemningen hos den nyåpnede vinbaren.\n\nBåbler er en liten vinbar, men med stor personlighet. Her får du herlig leken stemning, et hipt vinkart – og neonskilt på veggene såklart. Jo mørkere det blir ute, jo sterkere skinner neonlysene inne, og med 80-tallsbangers over høyttalerne er stemningen upåklagelig.\n\n«Vin behøver ikke å være seriøst» I enden av Bjerregaards gate ligger en vinbar det er vanskelig å gå forbi. Fasaden er fargerik, interiøret er som i et lekeland og på veggen henger et innrammet bilde av mottoet “Vin behøver ikke å være så jævlig seriøst”.\n\nDet er ekteparet Sonja Setare Rødahl og Mathias Rødahl som står bak konseptet, og stedet bærer tydelig preg av et ønske om nettopp å ikke ta dette med vin så altfor seriøst. Lysene på bordet har bilder av kjendiser, en vakker pride-regnbue neonlyser i vinduet, og på veggen henger et bilde av Kim Kardashian som spruter bobler på rumpa si.\n\nFør var dette en butikk hvor man kunne kjøpe neonskilt på bestilling, og man kunne designe sine helt egne neonskilt. Det kan man fortsatt gjøre, men inntil videre er lokalet forvandlet til vinbaren Båbler.\n\nBra vinkart og en halvliter for 75 kroner Utestedet kan riktignok skilte med andre ting enn bare neon, for her serveres det flasker fra hippe produsenter som Meinklang, Matassa, Milan Nestarec, Gut Oggau og Marcus Baumbergers. Eksempelvis en flaske av Baumbergers velkjente GlowGlow Riesling, får du til 750 kroner.\n\nVinkartet består av et godt utvalg både røde, hvite, oransje-, og roséviner som koster mellom 600-2000 kroner flaska. Dette inkluderer også et godt utvalg pét nat på flaske fra 650-850 kroner. Du kan altså finne deg noe funky her også!\n\nVin på glass koster mellom 120 og 290 kroner, og hold deg fast: en halvliter Sagene Pils koster 75 kroner! Med en gang man kommer inn i lokalet synes også et stort utvalg flasker med alkoholfrie bobler fra 250 kroner. Her snakker vi både kombucha og vinalternativer fra Ambijus, som er en norsk produsent.\n\nHer finnes også en søt drinkmeny bestående av, gin tonic, amaretto spritz, pink hugo spritz, limoncello spritz og campari negroni sbagliato. Alle koster 150 kroner.\n\nPerlende, boblende og sprudlende Undertegnede måtte selvsagt prøve Båblers bobler og gikk for et glass Bouchard Ainé & Fils Brut de Chardonnay (Charmat) til 130 kroner og en Charles Mignon Premium Reserve Brut (Champagne) til 180 kroner glasset.\n\nAlle boblene falt i smak, og det gjorde også snacksen. Her er nemlig ingenting overlatt til tilfeldighetene, for til og med ostepopen kommer i bobleform – og de fikk vi påfyll av hele kvelden.\n\nVinbaren kan riktignok ikke skryte på seg noen snacksmeny – den består foreløpig av ostepop og potetsticks. Det ryktes at det kommer et større utvalg av snacks etterhvert og det trengs, for her kan man bli sittende en stund!",
//     "images": [
//       {
//         "url": "https://images.squarespace-cdn.com/content/v1/5b4606ec96d4557cbd0f1e5d/cfcaa669-ec2b-4927-8451-5045753ebe34/BaablerVinbar-juni24-NoraSaeter-26.jpg",
//         "alt": "Image 3"
//       },
//       {
//         "url": "https://images.squarespace-cdn.com/content/v1/5b4606ec96d4557cbd0f1e5d/1720012196566-2ISY3PQPG8L4B65Z1EBW/BaablerVinbar-juni24-NoraSaeter-3.jpg",
//         "alt": "Du kan umulig gå forbi denne sjappa."
//       },
//       {
//         "url": "https://images.squarespace-cdn.com/content/v1/5b4606ec96d4557cbd0f1e5d/1720012188196-1NXC74MIOSLN8KKAT3LT/BaablerVinbar-juni24-NoraSaeter-32-min.JPEG",
//         "alt": "Useriøst interiør, men seriøst god vin."
//       },
//       {
//         "url": "https://images.squarespace-cdn.com/content/v1/5b4606ec96d4557cbd0f1e5d/1720012398995-DRTP8MU0773HTEVLF4QH/BaablerVinbar-juni24-NoraSaeter-11.jpg",
//         "alt": "Et utvalg alkoholfrie drikker på deilig display."
//       },
//       {
//         "url": "https://images.squarespace-cdn.com/content/v1/5b4606ec96d4557cbd0f1e5d/1720012405763-4CQV01YXLAOTV6MJZV2Z/BaablerVinbar-juni24-NoraSaeter-41-min.JPEG",
//         "alt": "Her får du alle farger vin på glass, til en alright pris."
//       },
//       {
//         "url": "https://images.squarespace-cdn.com/content/v1/5b4606ec96d4557cbd0f1e5d/1720012989460-24AJZ8JH1M9Z4LWE7P2A/BaablerVinbar-juni24-NoraSaeter-35-min.JPEG",
//         "alt": "Jo mørkere det er ute, jo finere ser det ut inne."
//       },
//       {
//         "url": "https://images.squarespace-cdn.com/content/v1/5b4606ec96d4557cbd0f1e5d/1720012992276-RW33PU03PPVP1WB6NH9D/BaablerVinbar-juni24-NoraSaeter-30-min.JPEG",
//         "alt": "Meinklang på glass!"
//       }
//     ],
//     "tags": [
//       "venueType:wine_bar",
//       "pricing:cheap_beer",
//       "feature:roof_terrace"
//     ],
//     "articleUrl": "https://meravoslo.no/nyheter/bobler-vinbar-neonlys-og-vin-i-et-lekent-lokale",
//     "address": "Bjerregaards gate 70",
//     "googleMapsUrl": "https://g.co/kgs/wZPo16z",
//     "openingHours": "Torsdag - lørdag: 18-01",
//     "district": "St. Hanshaugen"
//   }
// ]

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: Business) => void;
}

const TagsMultipleSelect = (props: any, { onValueChange }: {
  onValueChange: (newRecord: string[]) => void;
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const tagOptions = tags.map(tag => ({ value: tag, label: tag }));
  const defaultValue = tags.find((tag) => tag === props.defaultValue);

  useEffect(() => {
    supabaseFrontent.from("tags").select("name").then(({ data, error }) => {
      if (error) {
        console.log("error", error);
      } else {
        setTags(data.map(tag => tag.name));
      }
    });

  }, [])

  return (
    <MultiSelect
      defaultValue={defaultValue}
      options={tagOptions}
      onValueChange={onValueChange}
      placeholder="Select tags"
      variant="inverted"
      className="mb-4"
      {...props}
    />
  )
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [newRecord, setNewRecord] = useState<Business>({
    name: '',
    articleTitle: '',
    articleContent: '',
    images: [],
    tags: [],
    address: '',
    googleMapsUrl: '',
    openingHours: '',
    district: ''
  });

  const [imageInputs, setImageInputs] = useState<{ [key: number]: { url: string, alt: string } }>({});

  const handleAddImage = () => {
    const newKey = Object.keys(imageInputs).length;
    setImageInputs({ ...imageInputs, [newKey]: { url: '', alt: '' } });
  };

  const handleImageChange = (key: number, field: 'url' | 'alt', value: string) => {
    setImageInputs({
      ...imageInputs,
      [key]: { ...imageInputs[key], [field]: value }
    });
  };

  const handleRemoveImage = (key: number) => {
    const { [key]: _, ...rest } = imageInputs;
    setImageInputs(rest);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const images = Object.values(imageInputs).filter(img => img.url && img.alt);
    onAdd({ ...newRecord, images });
    setNewRecord({
      name: '',
      articleTitle: "",
      articleContent: '',
      images: [],
      tags: [],
      address: "",
      googleMapsUrl: "",
      openingHours: "",
      district: ""
    });
    setImageInputs({});
    onClose();
  };

  const handleTagChange = (selectedTags: string[]) => {
    setNewRecord({
      ...newRecord,
      tags: selectedTags
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={"overflow-y-scroll max-h-screen"}>
        <DialogHeader>
          <DialogTitle>Add New Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={newRecord.name}
            onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
            placeholder="Enter name"
            className="mb-2"
          />
          <Input
            value={newRecord.articleTitle}
            onChange={(e) => setNewRecord({ ...newRecord, articleTitle: e.target.value })}
            placeholder="Enter article title"
            className="mb-2"
          />
          <Textarea
            value={newRecord.articleContent}
            onChange={(e) => setNewRecord({ ...newRecord, articleContent: e.target.value })}
            placeholder="Enter article content"
            className="mb-2"
          />
          <Input
            value={newRecord.address}
            onChange={(e) => setNewRecord({ ...newRecord, address: e.target.value })}
            placeholder="Enter address"
            className="mb-2"
          />
          <Input
            value={newRecord.googleMapsUrl}
            onChange={(e) => setNewRecord({ ...newRecord, googleMapsUrl: e.target.value })}
            placeholder="Enter Google Maps URL"
            className="mb-2"
          />
          <Input
            value={newRecord.openingHours}
            onChange={(e) => setNewRecord({ ...newRecord, openingHours: e.target.value })}
            placeholder="Enter opening hours"
            className="mb-2"
          />
          <Input
            value={newRecord.district}
            onChange={(e) => setNewRecord({ ...newRecord, district: e.target.value })}
            placeholder="Enter district"
            className="mb-2"
          />
          <div className="mb-2">
            <Button type="button" onClick={handleAddImage}>Add Image</Button>
            {Object.entries(imageInputs).map(([key, image]) => (
              <div key={key} className="flex items-center mt-2">
                <Input
                  value={image.url}
                  onChange={(e) => handleImageChange(Number(key), 'url', e.target.value)}
                  placeholder="Image URL"
                  className="mr-2"
                />
                <Input
                  value={image.alt}
                  onChange={(e) => handleImageChange(Number(key), 'alt', e.target.value)}
                  placeholder="Image Alt Text"
                  className="mr-2"
                />
                <Button
                  type="button"
                  onClick={() => handleRemoveImage(Number(key))}
                  size="icon"
                  variant="ghost"
                >
                  <TrashIcon className="h-4 w-4"/>
                </Button>
              </div>
            ))}
          </div>
          <TagsMultipleSelect
            onValueChange={handleTagChange}
          />
          <DialogFooter>
            <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
            <Button type="submit">Add Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UrlForm: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Business[]>(dummyData);
  const [editingTags, setEditingTags] = useState<{ [key: number]: boolean }>({});
  const [tagInputs, setTagInputs] = useState<{ [key: number]: string[] }>({});
  const [editingImages, setEditingImages] = useState<{ [key: number]: boolean }>({});
  const [imageInputs, setImageInputs] = useState<{ [key: number]: { url: string, alt: string } }>({});
  const [formData, setFormData] = useState<{ url: string }>({
    url: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedInDb, setSavedInDb] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState<boolean>(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const handleAddRecord = (newRecord: Business) => {
    setData([...data, newRecord]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await extractDataFromUrl(formData.url.trim())
      if (!data.businesses) return null;

      setData(data.businesses)
      setLoading(false);
      console.log("data", data)
    } catch (e) {
      console.log("error", e)
    }
  };

  // Function to handle editing an existing image
  const handleEditImage = (recordIndex: number, imageIndex: number) => {
    // Update editingImages to show the form for the correct recordIndex
    setEditingImages({ ...editingImages, [recordIndex]: true });

    setIsEditingImage(true);
    setEditingImageIndex(imageIndex);
    setImageInputs({
      ...imageInputs,
      [recordIndex]: data[recordIndex].images[imageIndex],
    });
  };

  // Function to handle saving an image (either new or edited)
  const handleSaveImage = (recordIndex: number) => {
    const updatedData = [...data];

    if (isEditingImage && editingImageIndex !== null) {
      // Editing existing image
      updatedData[recordIndex].images[editingImageIndex] = imageInputs[recordIndex];
      setEditingImageIndex(null);
      setIsEditingImage(false);
    } else {
      // Adding new image
      updatedData[recordIndex].images.push(imageInputs[recordIndex]);
    }

    setData(updatedData);
    setEditingImages({ ...editingImages, [recordIndex]: false });
    setImageInputs({});
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 max-w-[500px]">
        <Input
          placeholder={"Enter URL"}
          type="text"
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
        />
        <Button type="button" onClick={handleSubmit}>{loading ? "loading" : "Scrape data"}</Button>
      </div>
      <div>
        {!!data.length && (
          <>
            <div className="flex justify-end">
              <Button onClick={() => setIsModalOpen(true)}>Add New Record</Button>
            </div>

            <AddRecordModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onAdd={handleAddRecord}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const updatedData = [...data];
                          updatedData[index].name = e.target.value;
                          setData(updatedData);
                        }}
                        placeholder="Enter name"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.articleTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const updatedData = [...data];
                          updatedData[index].articleTitle = e.target.value;
                          setData(updatedData);
                        }}
                        placeholder="Enter article title"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        contentEditable
                        rows={3}
                        value={item.articleContent}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const updatedData = [...data];
                          updatedData[index].articleContent = e.target.value;
                          setData(updatedData);
                        }}
                        placeholder="Enter content"
                      />
                    </TableCell>
                    <TableCell className="w-[300px]">
                      <ScrollArea className="h-[250px] rounded-md border p-4">
                        <div className="grid grid-cols-2 gap-2 w-52">
                          {item.images.map((image, imgIndex) => (
                            <div key={imgIndex} className="relative flex flex-col">
                              <img
                                src={image.url}
                                alt={image.alt}
                                className="object-cover rounded"
                              />
                              <p className="text-xs mt-1 text-gray-600 truncate">
                                {image.alt}
                              </p>
                              <div className="absolute top-1 right-1 flex gap-2">
                                <Button
                                  onClick={() => handleEditImage(index, imgIndex)}
                                  className="p-1 bg-white rounded-full z-10"
                                  size="icon"
                                >
                                  <PencilIcon color="green" className="h-4 w-4"/>
                                </Button>
                                <Button
                                  onClick={() => {
                                    const updatedData = [...data];
                                    updatedData[index].images = updatedData[
                                      index
                                      ].images.filter((_, i) => i !== imgIndex);
                                    setData(updatedData);
                                  }}
                                  className="p-1 bg-white rounded-full z-10"
                                  size="icon"
                                >
                                  <TrashIcon color="red" className="h-4 w-4"/>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Image editing form */}
                      {editingImages[index] && (
                        <div className="mt-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveImage(index);
                            }}
                          >
                            <Input
                              value={imageInputs[index]?.url || ''}
                              onChange={(e) =>
                                setImageInputs({
                                  ...imageInputs,
                                  [index]: {
                                    ...imageInputs[index],
                                    url: e.target.value
                                  }
                                })
                              }
                              placeholder="Enter image URL"
                              className="mb-2"
                            />
                            <Input
                              value={imageInputs[index]?.alt || ''}
                              onChange={(e) =>
                                setImageInputs({
                                  ...imageInputs,
                                  [index]: {
                                    ...imageInputs[index],
                                    alt: e.target.value
                                  }
                                })
                              }
                              placeholder="Enter image alt text"
                              className="mb-2"
                            />
                            <div className="flex gap-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingImages({
                                    ...editingImages,
                                    [index]: false
                                  });
                                  setIsEditingImage(false); // Exit editing mode
                                  setEditingImageIndex(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">
                                {isEditingImage ? "Save Edit" : "Add Image"}
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Add New Image button */}
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            setEditingImages({ ...editingImages, [index]: true });
                            setImageInputs({
                              ...imageInputs,
                              [index]: { url: '', alt: '' }
                            });
                          }}
                        >
                          Add New Image
                        </Button>
                      </div>
                    </TableCell>


                    <TableCell className="max-w-72">
                      {editingTags[index] ? (
                        <form onSubmit={(e: React.FormEvent) => {
                          e.preventDefault();
                          const updatedData = [...data];
                          updatedData[index].tags = tagInputs[index];
                          setData(updatedData);
                          setEditingTags({ ...editingTags, [index]: false });
                        }}>
                          <TagsMultipleSelect
                            onValueChange={(selectedTags: string[]) => setTagInputs({
                              ...tagInputs,
                              [index]: selectedTags
                            })}
                            defaultValue={item.tags}
                          />
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline"
                                    onClick={() => setEditingTags({ ...editingTags, [index]: false })}>Close</Button>
                            <Button type="submit">Save Tags</Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {item.tags.map((tag, tagIndex) => (
                            <span key={tagIndex}
                                  className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                          {tag}
                        </span>
                          ))}
                          <div>
                            <Button onClick={() => {
                              setEditingTags({ ...editingTags, [index]: true });
                              setTagInputs({ ...tagInputs, [index]: item.tags });
                            }}>
                              Edit Tags
                            </Button>
                          </div>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!!data.length && (
              <Button onClick={async () => {
                setLoading(true);
                await saveDataInDb(data)
                setData([])
                setFormData({ url: "" })
                setLoading(false);
                setSavedInDb(true);
              }}>{loading ? "saving..." : "Save in DB"}</Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UrlForm;
