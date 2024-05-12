import { Uploader } from 'components/Uploader';
import { cookies } from 'next/headers';
import { AssetsService } from './services/AssetsService';
import { AssetDTO } from './models/Asset';
import { Carousel, Image, Progress } from 'antd';
import { AssetRepository } from './repository/AssetRepository';
import { AssetGroupDto } from './dto/AssetGroupDto';
import { AssetGroupRepository } from './repository/AssetGroupRepository';

type props = {
    group: AssetGroupDto;
};

const AssetItem = (props: props) => {
    const { group } = props;
    return (
        <Carousel arrows infinite={true} autoplay={true}>
            {
                group.assets.map((asset: AssetDTO) => {
                    return (
                        <div key={asset.id} className="flex gap-4 rounded-xl relative w-[100%] h-[100%] shadow">
                            <div
                                className="
                            absolute p-5 rounded-xl border bg-white z-50
                            flex flex-col gap-2 justify-center items-center
                        "
                                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                            >
                                <Progress
                                    type="dashboard"
                                    percent={asset.optimizationPercent}
                                    size={80}
                                    strokeColor="green"
                                />
                                <span>{asset.reductionInKb} kB</span>
                                <span>{asset.reductionInCarbon} co2</span>
                            </div>
                            <div>
                                <Image
                                    src={`/api/image/${asset.optimizedFile.key}`}
                                    alt=""
                                    className="w-32 h-32 object-cover"
                                />
                            </div>
                        </div>
                    );
                })
            }
        </Carousel>
    );
};

type PageProps = {
    searchParams: {
        g?: string;
    }
}

const Page = async (props: PageProps) => {
    const { searchParams } = props;
    const { g } = searchParams;
    const cookie = cookies();
    const ar = new AssetRepository();
    const agr = new AssetGroupRepository();
    const as = new AssetsService();
    const assets = await ar.findBy({}, { created: 'desc' });
    const groups = await agr.findByDto({}, { created: 'desc' });
    let group: AssetGroupDto | undefined;
    if (g) {
        let t = await as.getAssetGroup(g);
        group = await t.toObject();
    }

    return (
        <main className="flex flex-col gap-8 sm:gap-16">
            <div className="flex justify-center items-center gap-2 bg-green-600 font-semibold p-5 rounded-xl opacity-85 text-white shadow">
                {['minify', 'your', '🏞️', 'and', 'save', 'the', '🌍', 'with'].map((word) => (
                    <span key={word}>{word}</span>
                ))}
                <Image src={'/netlify-logo.svg'} alt="Netlify logo" />
            </div>
            <Uploader group={group} />
            <div className='space-y-4'>
                <h2 className="text-xl bg-white rounded-xl p-4 opacity-85 border shadow">Contributors 💖</h2>
                <div className="grid  md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                        <AssetItem key={group.id} group={group} />
                    ))}
                </div>
            </div>
        </main>
    );
};

export default Page;
