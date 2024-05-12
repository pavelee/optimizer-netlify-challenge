'use client';

import { Button, Image, List, Slider, Spin, Upload, UploadFile } from 'antd';
import { CARBON_UNIT } from 'app/_config/constants';
import { AssetGroupDto } from 'app/dto/AssetGroupDto';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';

type UploaderProps = {
    group?: AssetGroupDto
};

export const Uploader = (props: UploaderProps) => {
    const { group } = props;
    const router = useRouter();
    const [assetGroup, setAssetGroup] = useState<AssetGroupDto | undefined>(group);
    const [quality, setQuality] = useState(75);
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isAnyFileUploading, setIsAnyFileUploading] = useState(false);

    useEffect(() => {
        if (group) {
            setFiles(group.assets.map((asset) => ({
                uid: asset.id,
                name: asset.optimizedFile.name,
                status: 'done',
                response: asset
            })));
        }
    }, [setFiles, group]);

    useEffect(() => {
        const uploadingCount = files.filter((file) => file.status === 'uploading');
        if (uploadingCount.length > 0) {
            setIsAnyFileUploading(true);
        } else {
            setIsAnyFileUploading(false);
        }
    }, [files]);

    useEffect(() => {
        if (isAnyFileUploading === false) {
            // router.refresh();
        }
    }, [isAnyFileUploading, router]);

    const refreshAssetGroup = async (group: AssetGroupDto) => {
        const response = await fetch(`/api/group/${group.id}`);
        const json = await response.json();
        // setFiles(json.assets.map((asset) => ({
        //     uid: asset.id,
        //     name: asset.optimizedFile.name,
        //     status: 'done',
        //     response: asset
        // })));
        setAssetGroup(json);
    }

    const addGroupIdToCurrentUrl = (groupId: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('g', groupId);
        window.history.pushState({}, '', url.toString());
    }

    const getSummary = () => {
        const totalReductionInKb = files.reduce((acc, file) => {
            if (file.status === 'done') {
                return acc + file.response.reductionInKb;
            }
            return acc;
        }, 0);

        const totalReductionInCarbon = files.reduce((acc, file) => {
            if (file.status === 'done') {
                return acc + file.response.reductionInCarbon;
            }
            return acc;
        }, 0);

        return {
            totalReductionInKb,
            totalReductionInCarbon
        };
    }

    const isPossibleToDownloadAll = () => {
        return isAnyFileUploading === false && assetGroup && assetGroup.assets.length > 0;
    };

    return (
        <div className='bg-white p-5 rounded-xl space-y-5 shadow'>
            <Upload.Dragger
                name="file"
                multiple={true}
                showUploadList={false}
                action="/api/image/optimize"
                customRequest={async (options) => {
                    let g: AssetGroupDto | null = assetGroup;
                    if (!g) {
                        const response = await fetch('/api/group', {
                            method: 'POST',
                            body: JSON.stringify({}),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        const json = await response.json();
                        g = json;
                        setAssetGroup(json);
                        addGroupIdToCurrentUrl(g.id);
                    }

                    const form = new FormData();
                    form.append('file', options.file);
                    // @ts-ignore it exists.. 😭
                    form.append('fileName', options.file.name ? options.file.name : 'file');
                    form.append('groupId', g.id);
                    form.append('q', quality.toString());
                    const response = await fetch('/api/image/optimize', {
                        method: 'POST',
                        body: form
                    });
                    const json = await response.json();
                    options.onSuccess(json);
                }}
                accept=".png,.jpg,.jpeg"
                onChange={(info) => {
                    setFiles([
                        // ...files,
                        ...(group ? group.assets.map((asset) => {
                            return {
                                uid: asset.id,
                                name: asset.optimizedFile.name,
                                status: 'done',
                                response: asset
                            } as UploadFile;
                        }) : []),
                        ...info.fileList
                    ]);
                    const { status } = info.file;
                    if (status !== 'uploading') {
                        // setFiles(info.fileList);
                    }
                    if (status === 'done') {
                        if (assetGroup) {
                            refreshAssetGroup(assetGroup);
                        }
                        // router.refresh();
                        // message.success(`${info.file.name} file uploaded successfully.`);
                    } else if (status === 'error') {
                        // message.error(`${info.file.name} file upload failed.`);
                    }
                }}
                onDrop={(e) => {
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    Drag & drop your files here or click to select. You can upload multiple files at once.
                </p>
                <p className="ant-upload-hint">
                    Images will be converted to webp format and optimized. Only .png, .jpg, .jpeg files are allowed.
                </p>
            </Upload.Dragger>
            <div className="space-y-2">
                <div className="flex flex-col justify-center items-center text-gray-600">quality - the less the better saving ({quality}%)</div>
                <Slider
                    value={quality}
                    onChange={(value) => setQuality(value)}
                />
            </div>
            {files.length > 0 && (
                <div className="space-y-4">
                    <List
                        className="border-t border-b"
                        itemLayout="horizontal"
                        dataSource={files}
                        renderItem={(file) => {
                            if (file.status === 'uploading') {
                                return (
                                    <Spin spinning={true}>
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={
                                                    <img
                                                        src={URL.createObjectURL(file.originFileObj)}
                                                        alt=""
                                                        style={{ height: '50px' }}
                                                    />
                                                }
                                                title={file.name}
                                                description={`optimizing...`}
                                            />
                                        </List.Item>
                                    </Spin>
                                );
                            }

                            if (file.status === 'done') {
                                return (
                                    <List.Item
                                        actions={[
                                            <a
                                                key="list-download"
                                                href={`/api/image/${file.response.optimizedFile.key}/download`}
                                            >
                                                <Button>Download</Button>
                                            </a>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Image
                                                    src={`api/image/${file.response.optimizedFile.key}`}
                                                    alt=""
                                                    width={50}
                                                />
                                            }
                                            title={file.response.optimizedFile.fullName}
                                            description={`
                                        You saved ${file.response.optimizationPercent}% (${file.response.reductionInKb} kB) (${file.response.reductionInCarbon} ${CARBON_UNIT})
                                    `}
                                        />
                                    </List.Item>
                                );
                            }

                            return null;
                        }}
                    />
                    <div className="flex items-center">
                        {
                            assetGroup && (
                                <div className='text-gray-400 text-sm grow'>
                                    🌲 Total reduction: {assetGroup.smartReduction.value} {assetGroup.smartReduction.unit} ({assetGroup.reductionInCarbon} {CARBON_UNIT})
                                </div>
                            )
                        }
                        {isPossibleToDownloadAll() && (
                            <div className="flex justify-end gap-2">
                                <Button
                                    onClick={async () => {
                                        try {
                                            const url = window.location.href;
                                            await navigator.clipboard.writeText(url);
                                        } catch (err) {
                                            console.log(err);
                                        }
                                    }}
                                >copy link</Button>
                                <a href={`api/group/${assetGroup.id}/download`}>
                                    <Button type="primary">Download All</Button>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
