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
import { useToast } from "@/components/ui/use-toast";


import { MultiSelect } from "@/components/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { TrashIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Business } from "@/app/admin/types";
import savePlacesInDb from "@/app/admin/actions/savePlacesInDb";
import saveActivityInDb from "@/app/admin/actions/saveActivityInDb";
import { MoreVertical, PencilIcon } from "lucide-react";
import { supabaseFrontent } from "@/lib/supabase/frontend";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabName } from "@/lib/types";
import { isActivity } from "@/lib/agents/extractTags";


const dummyData: Business[] | (() => Business[]) = []

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: Business) => void;
  name: string
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

const AddRecordModal: React.FC<AddRecordModalProps> = ({ isOpen, onClose, onAdd, name }) => {
  const [loading, setLoading] = useState(false);
  const [newRecord, setNewRecord] = useState<Business>({
    name: '',
    articleTitle: '',
    articleContent: '',
    articleUrl: '',
    images: [],
    tags: [],
  });

  const isPlaces = name === TabName.EAT_DRINK;

  console.log("isPlaces", isPlaces)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const images = Object.values(imageInputs).filter(img => img.url && img.alt);
    await onAdd({ ...newRecord, images });
    setNewRecord({
      name: '',
      articleTitle: '',
      articleContent: '',
      articleUrl: '',
      images: [],
      tags: [],
    });
    setLoading(false);
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
      <DialogContent className={"overflow-y-scroll max-h-screen bg-white"}>
        <DialogHeader>
          <DialogTitle>Add New Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={newRecord.name}
            onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
            placeholder="Name of activity or business *"
            className="mb-2"
            required
          />
          <Input
            value={newRecord.articleTitle}
            onChange={(e) => setNewRecord({ ...newRecord, articleTitle: e.target.value })}
            placeholder="Article title *"
            className="mb-2"
            required
          />
          <Input
            value={newRecord.articleUrl}
            onChange={(e) => setNewRecord({ ...newRecord, articleUrl: e.target.value })}
            placeholder="Article Url *"
            className="mb-2"
            required
          />
          <Textarea
            value={newRecord.articleContent}
            onChange={(e) => setNewRecord({ ...newRecord, articleContent: e.target.value })}
            placeholder="Article content *"
            className="mb-2"
            required
          />
          <Input
            value={newRecord.address}
            onChange={(e) => setNewRecord({ ...newRecord, address: e.target.value })}
            placeholder="Address"
            className="mb-2"
          />
          <Input
            value={newRecord.mapsUrl}
            onChange={(e) => setNewRecord({ ...newRecord, mapsUrl: e.target.value })}
            placeholder="Google Maps URL"
            className="mb-2"
          />
          <Input
            value={newRecord.openingHours}
            onChange={(e) => setNewRecord({ ...newRecord, openingHours: e.target.value })}
            placeholder="Opening hours"
            className="mb-2"
          />
          <Input
            value={newRecord.district}
            onChange={(e) => setNewRecord({ ...newRecord, district: e.target.value })}
            placeholder="District"
            className="mb-2"
          />
          {isPlaces && <Input
            value={newRecord.bookingUrl}
            onChange={(e) => setNewRecord({ ...newRecord, bookingUrl: e.target.value })}
            placeholder="Booking url"
            className="mb-2"
          />}
          {isPlaces && <Input
            value={newRecord.websiteUrl}
            onChange={(e) => setNewRecord({ ...newRecord, websiteUrl: e.target.value })}
            placeholder="Website url"
            className="mb-2"
          />}
          {isPlaces && <Input
            value={newRecord.menuText}
            onChange={(e) => setNewRecord({ ...newRecord, menuText: e.target.value })}
            placeholder="Menu text content"
            className="mb-2"
          />
          }
          {isPlaces && <Input
            value={newRecord.foodMenuUrl}
            onChange={(e) => setNewRecord({ ...newRecord, foodMenuUrl: e.target.value })}
            placeholder="Food Menu Url"
            className="mb-2"
          />}
          <div className="mb-2">
            <Button type="button" onClick={handleAddImage}>Add Image</Button>
            {Object.entries(imageInputs).map(([key, image]) => (
              <div key={key} className="flex items-center mt-2">
                <Input
                  value={image.url}
                  onChange={(e) => handleImageChange(Number(key), 'url', e.target.value)}
                  placeholder="Image URL from an article"
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
            <Button disabled={loading} type="submit">{loading ? "loading..." : "Add Record"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EditableTable = ({ name, data: propsData }: { name: string, data: Business[] }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Business[]>(propsData);
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

  const { toast } = useToast();

  const handleAddRecord = async (newRecord: Business) => {
    setLoading(true);
    const rowData = newRecord

    try {
      if (TabName.ACTIVITIES === name) {
        await saveActivityInDb([rowData]);
      } else {
        await savePlacesInDb([rowData]);
      }
      toast({
        title: "Success",
        description: "Record updated successfully",
        duration: 3000,
      });

      setData([rowData, ...data]);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
        duration: 3000,
      });
      console.error("Error saving row:", error);
    }
  };

  const handleSaveOrEditRow = async (index: number) => {
    setLoading(true);
    const rowData = data[index];
    try {
      if (TabName.ACTIVITIES === name) {
        await saveActivityInDb([rowData]);
      } else {
        await savePlacesInDb([rowData]);
      }
      toast({
        title: "Success",
        description: "Record updated successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
        duration: 3000,
      });
      console.error("Error saving row:", error);
    }
    setLoading(false);
  };

  const handleRemoveRow = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    setData(updatedData);
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
              name={name}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>

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
                          {item?.images?.map((image, imgIndex) => (
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
                          {item?.tags?.map((tag, tagIndex) => (
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            {/* You can use an icon here, like three dots for more options */}
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleSaveOrEditRow(index)}>
                            Save
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemoveRow(index)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!!data.length && (
              <Button onClick={async () => {
                setLoading(true);
                TabName.ACTIVITIES === name ? await saveActivityInDb(data) : await savePlacesInDb(data)
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

export default EditableTable;
