export interface DataMembers {
    user_id:        number;
    first_name:     string;
    last_name:      string;
    username:       string;
    email:          string; 
    password:       string;
    phone:          string;
    address:        null;
    lineID:         null;
    facebook:       null;
    province:       null;
    image_profile:  string;
    description:    null;
    date_of_member: Date;
    type_user:      number;
    sht_status:     number;
}
export interface DataTegs {
    tags_id:   number;
    name_tags: string;
}

export interface DataPortfolio {
    user_id:       number;
    first_name:    null | string;
    last_name:     null | string;
    username:      null | string;
    email:         string;
    address:       null | string;
    lineID:        null | string;
    facebook:      null | string;
    province:      null | string;
    image_profile: string;
    description:   null | string;
    portfolio_id:  number | null;
    name_work:     null | string;
    tags_id:       number | null;
    name_tags:     null | string;
    image_urls:    string[];
}

export interface DataSreach {
    user_id:       number;
    first_name:    string;
    last_name:     string;
    username:      string;
    email:         string;
    address:       string;
    lineID:        string;
    phone:         string;
    province:      string;
    image_profile: string;
    description:   string;
    portfolio_id:  number;
    name_work:     string;
    tags_id:       number;
    name_tags:     string;
    price:         number;
    image_urls:    string[];
}