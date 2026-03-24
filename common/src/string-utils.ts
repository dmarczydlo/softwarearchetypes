export abstract class StringUtils {

    public static isNotBlank(value: string | null | undefined): boolean {
        return value != null && value.trim().length > 0;
    }
}
