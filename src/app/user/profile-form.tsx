// components/user/ProfileForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/toast-provider";
import Spinner from "@/components/spinner";

type Address = { line1: string; city: string; state: string; zip: string; country: string };

// Minimal country dial list (name + iso2 + dial_code).
// This list covers the common/standard dialing codes. If you want the complete
// countrycode.org dataset loaded dynamically instead, I can add a server API to fetch/cache it.
const COUNTRY_CODES: { name: string; iso2: string; dial_code: string }[] = [
    { name: "Afghanistan", iso2: "AF", dial_code: "+93" },
    { name: "Albania", iso2: "AL", dial_code: "+355" },
    { name: "Algeria", iso2: "DZ", dial_code: "+213" },
    { name: "American Samoa", iso2: "AS", dial_code: "+1 684" },
    { name: "Andorra", iso2: "AD", dial_code: "+376" },
    { name: "Angola", iso2: "AO", dial_code: "+244" },
    { name: "Anguilla", iso2: "AI", dial_code: "+1 264" },
    { name: "Antigua and Barbuda", iso2: "AG", dial_code: "+1 268" },
    { name: "Argentina", iso2: "AR", dial_code: "+54" },
    { name: "Armenia", iso2: "AM", dial_code: "+374" },
    { name: "Aruba", iso2: "AW", dial_code: "+297" },
    { name: "Australia", iso2: "AU", dial_code: "+61" },
    { name: "Austria", iso2: "AT", dial_code: "+43" },
    { name: "Azerbaijan", iso2: "AZ", dial_code: "+994" },
    { name: "Bahamas", iso2: "BS", dial_code: "+1 242" },
    { name: "Bahrain", iso2: "BH", dial_code: "+973" },
    { name: "Bangladesh", iso2: "BD", dial_code: "+880" },
    { name: "Barbados", iso2: "BB", dial_code: "+1 246" },
    { name: "Belarus", iso2: "BY", dial_code: "+375" },
    { name: "Belgium", iso2: "BE", dial_code: "+32" },
    { name: "Belize", iso2: "BZ", dial_code: "+501" },
    { name: "Benin", iso2: "BJ", dial_code: "+229" },
    { name: "Bermuda", iso2: "BM", dial_code: "+1 441" },
    { name: "Bhutan", iso2: "BT", dial_code: "+975" },
    { name: "Bolivia", iso2: "BO", dial_code: "+591" },
    { name: "Bosnia and Herzegovina", iso2: "BA", dial_code: "+387" },
    { name: "Botswana", iso2: "BW", dial_code: "+267" },
    { name: "Brazil", iso2: "BR", dial_code: "+55" },
    { name: "British Indian Ocean Territory", iso2: "IO", dial_code: "+246" },
    { name: "British Virgin Islands", iso2: "VG", dial_code: "+1 284" },
    { name: "Brunei", iso2: "BN", dial_code: "+673" },
    { name: "Bulgaria", iso2: "BG", dial_code: "+359" },
    { name: "Burkina Faso", iso2: "BF", dial_code: "+226" },
    { name: "Burundi", iso2: "BI", dial_code: "+257" },
    { name: "Cambodia", iso2: "KH", dial_code: "+855" },
    { name: "Cameroon", iso2: "CM", dial_code: "+237" },
    { name: "Canada", iso2: "CA", dial_code: "+1" },
    { name: "Cape Verde", iso2: "CV", dial_code: "+238" },
    { name: "Cayman Islands", iso2: "KY", dial_code: "+1 345" },
    { name: "Central African Republic", iso2: "CF", dial_code: "+236" },
    { name: "Chad", iso2: "TD", dial_code: "+235" },
    { name: "Chile", iso2: "CL", dial_code: "+56" },
    { name: "China", iso2: "CN", dial_code: "+86" },
    { name: "Christmas Island", iso2: "CX", dial_code: "+61" },
    { name: "Cocos (Keeling) Islands", iso2: "CC", dial_code: "+61" },
    { name: "Colombia", iso2: "CO", dial_code: "+57" },
    { name: "Comoros", iso2: "KM", dial_code: "+269" },
    { name: "Cook Islands", iso2: "CK", dial_code: "+682" },
    { name: "Costa Rica", iso2: "CR", dial_code: "+506" },
    { name: "Croatia", iso2: "HR", dial_code: "+385" },
    { name: "Cuba", iso2: "CU", dial_code: "+53" },
    { name: "Curaçao", iso2: "CW", dial_code: "+599" },
    { name: "Cyprus", iso2: "CY", dial_code: "+357" },
    { name: "Czech Republic", iso2: "CZ", dial_code: "+420" },
    { name: "Democratic Republic of Congo", iso2: "CD", dial_code: "+243" },
    { name: "Denmark", iso2: "DK", dial_code: "+45" },
    { name: "Djibouti", iso2: "DJ", dial_code: "+253" },
    { name: "Dominica", iso2: "DM", dial_code: "+1 767" },
    { name: "Dominican Republic", iso2: "DO", dial_code: "+1 809" },
    { name: "Ecuador", iso2: "EC", dial_code: "+593" },
    { name: "Egypt", iso2: "EG", dial_code: "+20" },
    { name: "El Salvador", iso2: "SV", dial_code: "+503" },
    { name: "Equatorial Guinea", iso2: "GQ", dial_code: "+240" },
    { name: "Eritrea", iso2: "ER", dial_code: "+291" },
    { name: "Estonia", iso2: "EE", dial_code: "+372" },
    { name: "Ethiopia", iso2: "ET", dial_code: "+251" },
    { name: "Falkland Islands", iso2: "FK", dial_code: "+500" },
    { name: "Faroe Islands", iso2: "FO", dial_code: "+298" },
    { name: "Fiji", iso2: "FJ", dial_code: "+679" },
    { name: "Finland", iso2: "FI", dial_code: "+358" },
    { name: "France", iso2: "FR", dial_code: "+33" },
    { name: "French Polynesia", iso2: "PF", dial_code: "+689" },
    { name: "Gabon", iso2: "GA", dial_code: "+241" },
    { name: "Gambia", iso2: "GM", dial_code: "+220" },
    { name: "Georgia", iso2: "GE", dial_code: "+995" },
    { name: "Germany", iso2: "DE", dial_code: "+49" },
    { name: "Ghana", iso2: "GH", dial_code: "+233" },
    { name: "Gibraltar", iso2: "GI", dial_code: "+350" },
    { name: "Greece", iso2: "GR", dial_code: "+30" },
    { name: "Greenland", iso2: "GL", dial_code: "+299" },
    { name: "Grenada", iso2: "GD", dial_code: "+1 473" },
    { name: "Guam", iso2: "GU", dial_code: "+1 671" },
    { name: "Guatemala", iso2: "GT", dial_code: "+502" },
    { name: "Guernsey", iso2: "GG", dial_code: "+44 1481" },
    { name: "Guinea", iso2: "GN", dial_code: "+224" },
    { name: "Guinea-Bissau", iso2: "GW", dial_code: "+245" },
    { name: "Guyana", iso2: "GY", dial_code: "+592" },
    { name: "Haiti", iso2: "HT", dial_code: "+509" },
    { name: "Honduras", iso2: "HN", dial_code: "+504" },
    { name: "Hong Kong", iso2: "HK", dial_code: "+852" },
    { name: "Hungary", iso2: "HU", dial_code: "+36" },
    { name: "Iceland", iso2: "IS", dial_code: "+354" },
    { name: "India", iso2: "IN", dial_code: "+91" },
    { name: "Indonesia", iso2: "ID", dial_code: "+62" },
    { name: "Iran", iso2: "IR", dial_code: "+98" },
    { name: "Iraq", iso2: "IQ", dial_code: "+964" },
    { name: "Ireland", iso2: "IE", dial_code: "+353" },
    { name: "Isle of Man", iso2: "IM", dial_code: "+44 1624" },
    { name: "Israel", iso2: "IL", dial_code: "+972" },
    { name: "Italy", iso2: "IT", dial_code: "+39" },
    { name: "Ivory Coast", iso2: "CI", dial_code: "+225" },
    { name: "Jamaica", iso2: "JM", dial_code: "+1 876" },
    { name: "Japan", iso2: "JP", dial_code: "+81" },
    { name: "Jersey", iso2: "JE", dial_code: "+44 1534" },
    { name: "Jordan", iso2: "JO", dial_code: "+962" },
    { name: "Kazakhstan", iso2: "KZ", dial_code: "+7 6" },
    { name: "Kenya", iso2: "KE", dial_code: "+254" },
    { name: "Kiribati", iso2: "KI", dial_code: "+686" },
    { name: "Kosovo", iso2: "XK", dial_code: "+383" },
    { name: "Kuwait", iso2: "KW", dial_code: "+965" },
    { name: "Kyrgyzstan", iso2: "KG", dial_code: "+996" },
    { name: "Laos", iso2: "LA", dial_code: "+856" },
    { name: "Latvia", iso2: "LV", dial_code: "+371" },
    { name: "Lebanon", iso2: "LB", dial_code: "+961" },
    { name: "Lesotho", iso2: "LS", dial_code: "+266" },
    { name: "Liberia", iso2: "LR", dial_code: "+231" },
    { name: "Libya", iso2: "LY", dial_code: "+218" },
    { name: "Liechtenstein", iso2: "LI", dial_code: "+423" },
    { name: "Lithuania", iso2: "LT", dial_code: "+370" },
    { name: "Luxembourg", iso2: "LU", dial_code: "+352" },
    { name: "Macau", iso2: "MO", dial_code: "+853" },
    { name: "North Macedonia", iso2: "MK", dial_code: "+389" },
    { name: "Madagascar", iso2: "MG", dial_code: "+261" },
    { name: "Malawi", iso2: "MW", dial_code: "+265" },
    { name: "Malaysia", iso2: "MY", dial_code: "+60" },
    { name: "Maldives", iso2: "MV", dial_code: "+960" },
    { name: "Mali", iso2: "ML", dial_code: "+223" },
    { name: "Malta", iso2: "MT", dial_code: "+356" },
    { name: "Marshall Islands", iso2: "MH", dial_code: "+692" },
    { name: "Mauritania", iso2: "MR", dial_code: "+222" },
    { name: "Mauritius", iso2: "MU", dial_code: "+230" },
    { name: "Mayotte", iso2: "YT", dial_code: "+262" },
    { name: "Mexico", iso2: "MX", dial_code: "+52" },
    { name: "Micronesia", iso2: "FM", dial_code: "+691" },
    { name: "Moldova", iso2: "MD", dial_code: "+373" },
    { name: "Monaco", iso2: "MC", dial_code: "+377" },
    { name: "Mongolia", iso2: "MN", dial_code: "+976" },
    { name: "Montenegro", iso2: "ME", dial_code: "+382" },
    { name: "Montserrat", iso2: "MS", dial_code: "+1 664" },
    { name: "Morocco", iso2: "MA", dial_code: "+212" },
    { name: "Mozambique", iso2: "MZ", dial_code: "+258" },
    { name: "Myanmar", iso2: "MM", dial_code: "+95" },
    { name: "Namibia", iso2: "NA", dial_code: "+264" },
    { name: "Nauru", iso2: "NR", dial_code: "+674" },
    { name: "Nepal", iso2: "NP", dial_code: "+977" },
    { name: "Netherlands", iso2: "NL", dial_code: "+31" },
    { name: "New Caledonia", iso2: "NC", dial_code: "+687" },
    { name: "New Zealand", iso2: "NZ", dial_code: "+64" },
    { name: "Nicaragua", iso2: "NI", dial_code: "+505" },
    { name: "Niger", iso2: "NE", dial_code: "+227" },
    { name: "Nigeria", iso2: "NG", dial_code: "+234" },
    { name: "Niue", iso2: "NU", dial_code: "+683" },
    { name: "Norfolk Island", iso2: "NF", dial_code: "+672" },
    { name: "Northern Mariana Islands", iso2: "MP", dial_code: "+1 670" },
    { name: "Norway", iso2: "NO", dial_code: "+47" },
    { name: "Oman", iso2: "OM", dial_code: "+968" },
    { name: "Pakistan", iso2: "PK", dial_code: "+92" },
    { name: "Palau", iso2: "PW", dial_code: "+680" },
    { name: "Panama", iso2: "PA", dial_code: "+507" },
    { name: "Papua New Guinea", iso2: "PG", dial_code: "+675" },
    { name: "Paraguay", iso2: "PY", dial_code: "+595" },
    { name: "Peru", iso2: "PE", dial_code: "+51" },
    { name: "Philippines", iso2: "PH", dial_code: "+63" },
    { name: "Poland", iso2: "PL", dial_code: "+48" },
    { name: "Portugal", iso2: "PT", dial_code: "+351" },
    { name: "Puerto Rico", iso2: "PR", dial_code: "+1 787" },
    { name: "Qatar", iso2: "QA", dial_code: "+974" },
    { name: "Réunion", iso2: "RE", dial_code: "+262" },
    { name: "Romania", iso2: "RO", dial_code: "+40" },
    { name: "Russia", iso2: "RU", dial_code: "+7" },
    { name: "Rwanda", iso2: "RW", dial_code: "+250" },
    { name: "Saint Kitts and Nevis", iso2: "KN", dial_code: "+1 869" },
    { name: "Saint Lucia", iso2: "LC", dial_code: "+1 758" },
    { name: "Saint Vincent and the Grenadines", iso2: "VC", dial_code: "+1 784" },
    { name: "Samoa", iso2: "WS", dial_code: "+685" },
    { name: "San Marino", iso2: "SM", dial_code: "+378" },
    { name: "Sao Tome and Principe", iso2: "ST", dial_code: "+239" },
    { name: "Saudi Arabia", iso2: "SA", dial_code: "+966" },
    { name: "Senegal", iso2: "SN", dial_code: "+221" },
    { name: "Serbia", iso2: "RS", dial_code: "+381" },
    { name: "Seychelles", iso2: "SC", dial_code: "+248" },
    { name: "Sierra Leone", iso2: "SL", dial_code: "+232" },
    { name: "Singapore", iso2: "SG", dial_code: "+65" },
    { name: "Sint Maarten", iso2: "SX", dial_code: "+1 721" },
    { name: "Slovakia", iso2: "SK", dial_code: "+421" },
    { name: "Slovenia", iso2: "SI", dial_code: "+386" },
    { name: "Solomon Islands", iso2: "SB", dial_code: "+677" },
    { name: "Somalia", iso2: "SO", dial_code: "+252" },
    { name: "South Africa", iso2: "ZA", dial_code: "+27" },
    { name: "South Korea", iso2: "KR", dial_code: "+82" },
    { name: "South Sudan", iso2: "SS", dial_code: "+211" },
    { name: "Spain", iso2: "ES", dial_code: "+34" },
    { name: "Sri Lanka", iso2: "LK", dial_code: "+94" },
    { name: "Sudan", iso2: "SD", dial_code: "+249" },
    { name: "Suriname", iso2: "SR", dial_code: "+597" },
    { name: "Svalbard and Jan Mayen", iso2: "SJ", dial_code: "+47" },
    { name: "Sweden", iso2: "SE", dial_code: "+46" },
    { name: "Switzerland", iso2: "CH", dial_code: "+41" },
    { name: "Syria", iso2: "SY", dial_code: "+963" },
    { name: "Taiwan", iso2: "TW", dial_code: "+886" },
    { name: "Tajikistan", iso2: "TJ", dial_code: "+992" },
    { name: "Tanzania", iso2: "TZ", dial_code: "+255" },
    { name: "Thailand", iso2: "TH", dial_code: "+66" },
    { name: "Timor-Leste", iso2: "TL", dial_code: "+670" },
    { name: "Togo", iso2: "TG", dial_code: "+228" },
    { name: "Tokelau", iso2: "TK", dial_code: "+690" },
    { name: "Tonga", iso2: "TO", dial_code: "+676" },
    { name: "Trinidad and Tobago", iso2: "TT", dial_code: "+1 868" },
    { name: "Tunisia", iso2: "TN", dial_code: "+216" },
    { name: "Turkey", iso2: "TR", dial_code: "+90" },
    { name: "Turkmenistan", iso2: "TM", dial_code: "+993" },
    { name: "Turks and Caicos Islands", iso2: "TC", dial_code: "+1 649" },
    { name: "Tuvalu", iso2: "TV", dial_code: "+688" },
    { name: "U.S. Virgin Islands", iso2: "VI", dial_code: "+1 340" },
    { name: "Uganda", iso2: "UG", dial_code: "+256" },
    { name: "Ukraine", iso2: "UA", dial_code: "+380" },
    { name: "United Arab Emirates", iso2: "AE", dial_code: "+971" },
    { name: "United Kingdom", iso2: "GB", dial_code: "+44" },
    { name: "United States", iso2: "US", dial_code: "+1" },
    { name: "Uruguay", iso2: "UY", dial_code: "+598" },
    { name: "Uzbekistan", iso2: "UZ", dial_code: "+998" },
    { name: "Vanuatu", iso2: "VU", dial_code: "+678" },
    { name: "Vatican City", iso2: "VA", dial_code: "+379" },
    { name: "Venezuela", iso2: "VE", dial_code: "+58" },
    { name: "Vietnam", iso2: "VN", dial_code: "+84" },
    { name: "Wallis and Futuna", iso2: "WF", dial_code: "+681" },
    { name: "Yemen", iso2: "YE", dial_code: "+967" },
    { name: "Zambia", iso2: "ZM", dial_code: "+260" },
    { name: "Zimbabwe", iso2: "ZW", dial_code: "+263" },
];

export default function ProfileForm() {
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [countryCode, setCountryCode] = useState<string>("+63"); // default PH
    const [phoneLocal, setPhoneLocal] = useState<string>("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [address, setAddress] = useState<Address>({ line1: "", city: "", state: "", zip: "", country: "" });
    const [image, setImage] = useState<string | null>(null);

    // privacy modal
    const [privacyOpen, setPrivacyOpen] = useState(false);

    // show privacy modal once per session unless already accepted
    useEffect(() => {
        const seen = typeof window !== "undefined" ? localStorage.getItem("sbkz_seen_privacy") : null;
        if (!seen) {
            setPrivacyOpen(true);
            // don't set localStorage until they explicitly accept (so they can re-open on right corner)
        }
    }, []);

    const load = async () => {
        setInitialLoading(true);
        try {
            const res = await fetch("/api/user/profile");
            if (!res.ok) throw new Error("Failed to load profile");
            const data = await res.json();
            const u = data.user;
            setFirstName(u.firstName ?? "");
            setLastName(u.lastName ?? "");
            // parse phone into dial and local if possible
            if (u.phone) {
                // try to find prefix match from our list
                const matched = COUNTRY_CODES.find((c) => u.phone.startsWith(c.dial_code));
                if (matched) {
                    setCountryCode(matched.dial_code);
                    setPhoneLocal(u.phone.slice(matched.dial_code.length).trim());
                } else {
                    // fallback: set local full
                    setPhoneLocal(u.phone);
                }
            }
            setDateOfBirth(u.dateOfBirth ? u.dateOfBirth.substring(0, 10) : "");
            setAddress(u.address ?? { line1: "", city: "", state: "", zip: "", country: "" });
            setImage(u.image ?? null);
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onFile = (f?: File | null) => {
        if (!f) return;
        if (!f.type.startsWith("image/")) return toast.push({ title: "Invalid", message: "Please choose an image", level: "error" });
        if (f.size > 500 * 1024) return toast.push({ title: "Too large", message: "Image must be ≤ 500 KB", level: "error" });

        const reader = new FileReader();
        reader.onload = () => setImage(String(reader.result));
        reader.readAsDataURL(f);
    };

    const submit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        // simple validation
        if (!firstName || !lastName || !phoneLocal || !dateOfBirth || !address.line1 || !address.city || !address.zip || !address.country) {
            toast.push({ title: "Missing fields", message: "Please fill all required fields before saving.", level: "warning" });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                firstName,
                lastName,
                phone: `${countryCode} ${phoneLocal}`.trim(),
                dateOfBirth,
                address,
                image,
            };
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                const err = data?.error?.message || JSON.stringify(data?.error) || "Failed to save";
                throw new Error(err);
            }
            toast.push({ title: "Saved", message: "Profile updated", level: "success" });
            // if privacy modal still open and user accepted, we mark it accepted
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("Profile save error:", err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setLoading(false);
        }
    };

    const acceptPrivacy = () => {
        try {
            localStorage.setItem("sbkz_seen_privacy", "1");
        } catch (e) {
            console.log(e)
        }
        setPrivacyOpen(false);
        toast.push({ title: "Thanks", message: "You accepted the data privacy notice.", level: "info" });
    };

    return (
        <div className="relative">
            {/* privacy open button at top-right */}
            <div className="absolute right-0 -top-4">
                <button
                    onClick={() => setPrivacyOpen(true)}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-sm"
                    aria-label="Data privacy"
                >
                    Data Privacy
                </button>
            </div>

            {initialLoading ? (
                <span className="flex items-center gap-3">
                    <Spinner />
                    <p className="ml-2 text-gray-400">Loading profile...</p>
                </span>
            ) : (
                <>
                    <form onSubmit={submit} className="space-y-3 w-full">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm">First name</label>
                                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="border p-2 w-full" />
                            </div>
                            <div>
                                <label className="block text-sm">Last name</label>
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="border p-2 w-full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 items-end">
                            <div className="col-span-1">
                                <label className="block text-sm">Country</label>
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="border p-2 w-full bg-gray-900/60 text-white"
                                    aria-label="Country code"
                                >
                                    {COUNTRY_CODES.map((c) => (
                                        <option key={c.iso2 + c.dial_code} value={c.dial_code}>
                                            {c.name} ({c.dial_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-3">
                                <label className="block text-sm">
                                    Phone (local)
                                    <span className="text-xs text-gray-400 ml-1 mt-1">Full phone will be saved as: {`${countryCode} ${phoneLocal}`}</span>
                                </label>
                                <input
                                    value={phoneLocal}
                                    onChange={(e) => setPhoneLocal(e.target.value)}
                                    required
                                    className="border p-2 w-full"
                                    placeholder="e.g. 912345678"
                                    inputMode="tel"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm">Date of Birth</label>
                                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required className="border p-2 w-full" />
                            </div>
                            <div>
                                <label className="block text-sm">Profile photo (optional, ≤ 500KB)</label>
                                <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
                                {image && <div className="mt-2"><img src={image} alt="profile" className="w-24 h-24 object-cover rounded" /></div>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm">Address line 1</label>
                            <input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} required className="border p-2 w-full" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm">City</label>
                                <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required className="border p-2 w-full" />
                            </div>
                            <div>
                                <label className="block text-sm">State</label>
                                <input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required className="border p-2 w-full" />
                            </div>
                            <div>
                                <label className="block text-sm">ZIP</label>
                                <input value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} required className="border p-2 w-full" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm">Country</label>
                            <input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} required className="border p-2 w-full" />
                        </div>

                        <div className="flex gap-2 justify-end mt-4 items-center">
                            <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">
                                {loading ? "Saving..." : "Save profile"}
                            </button>
                        </div>
                    </form>
                </>
            )}

            {/* Privacy Modal */}
            {privacyOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setPrivacyOpen(false)}
                >
                    <div className="bg-white text-black rounded-lg max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Data Privacy & How We Use Your Data</h3>
                                <p className="text-sm text-gray-600">Please read how we store and use the personal information you provide.</p>
                            </div>
                            <button onClick={() => setPrivacyOpen(false)} aria-label="Close" className="text-gray-600 hover:text-gray-800">✕</button>
                        </div>

                        <div className="mt-4 prose max-w-none text-sm text-gray-700">
                            <p><strong>Purpose:</strong> We use your personal information to process orders, send tickets/receipts, and communicate important event updates (changes, cancellations).</p>
                            <p><strong>Storage:</strong> Your data is stored securely in our database. Photos are stored as base64 in the database for now — we recommend migrating to object storage (S3) in production.</p>
                            <p><strong>Sharing:</strong> We never sell your data. We may share necessary details with payment processors (Stripe/Wise/PayPal) to complete your transaction.</p>
                            <p><strong>Retention:</strong> We retain order and billing data for accounting and legal compliance. You can request deletion by contacting support.</p>
                            <p><strong>Your rights:</strong> You can view and update your profile on this page. To remove your data, contact the team at support@yourdomain.test.</p>
                            <p className="text-xs text-gray-500">This is a short summary. For full privacy policy see the Privacy & Terms page (link in footer).</p>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => { /* dismiss but don't accept */ setPrivacyOpen(false); }} className="px-3 py-1 bg-gray-200 rounded">Close</button>
                            <button onClick={acceptPrivacy} className="px-3 py-1 bg-blue-600 text-white rounded">I Accept</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
