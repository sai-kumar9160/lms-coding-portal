import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    public static void main(String[] args) throws Exception {
        Pattern code = Pattern.compile("[a-z][a-z0-9-]{2,19}");
        System.out.println(code.matcher("srk123").matches());
        System.out.println(code.matcher("SRK!").matches());
    }
}
